// src/routes/chat.ts — POST /chat with multi-agent routing.
//
// Chapter 9: instead of a single all-purpose agent, the request
// is first classified by the router (one small LLM call), then
// dispatched to ONE of three specialists:
//
//   - booking   : availability, reservations, prices.
//   - support   : cancellations, complaints, lateness.
//   - marketing : recommendations, promotions, gift cards.
//
// Each specialist owns its own tools and its own system prompt.
// The conversation history is shared — the active agent can
// change between turns, and the next agent sees everything the
// previous one said.
//
// The chosen agent name is returned in the X-Agent header (after
// X-Conversation-Id) so the client can show a "transferred to
// support" hint in the UI if useful.

import { Hono } from "hono";
import { stream } from "hono/streaming";
import { streamText, stepCountIs } from "ai";
import { bookingAgent } from "../agents/booking-agent";
import { supportAgent } from "../agents/support-agent";
import { marketingAgent } from "../agents/marketing-agent";
import { routeIntent, type AgentName } from "../agents/router";
import {
  loadHistory,
  newConversationId,
  saveMessage,
} from "../db/messages";
import { trace } from "../lib/trace";
import { checkPromptSafety } from "../lib/safety";
import { estimateCost } from "../lib/cost";
import { rateLimit } from "../lib/rate-limit";

export const chatRoute = new Hono();

const agents = {
  booking: bookingAgent,
  support: supportAgent,
  marketing: marketingAgent,
} as const;

// 30 messages per minute per IP — generous for legitimate chat,
// tight enough to stop a runaway script burning tokens. Tune to
// taste in production.
chatRoute.use(
  "/*",
  rateLimit({ windowMs: 60_000, max: 30 }),
);

chatRoute.post("/", async (c) => {
  const body = await c.req.json<{
    message?: string;
    conversationId?: string;
  }>();
  const message = body.message;

  if (typeof message !== "string" || message.trim().length === 0) {
    return c.json(
      { error: "Body must contain a non-empty 'message'." },
      400,
    );
  }

  // First-line prompt-injection filter. Cheap, deterministic,
  // catches the obvious "ignore previous instructions" attempts
  // BEFORE we burn a single LLM token. See src/lib/safety.ts.
  const safety = checkPromptSafety(message);
  if (!safety.safe) {
    trace({
      kind: "safety_block",
      reason: safety.reason,
      messageLength: message.length,
    });
    return c.json(
      {
        error:
          "Désolée, je ne peux pas répondre à ce message. " +
          "Reformulez votre demande, je suis là pour vous aider.",
      },
      400,
    );
  }

  const conversationId = body.conversationId ?? newConversationId();
  await saveMessage(conversationId, "user", message);

  const history = await loadHistory(conversationId);

  const turnStart = Date.now();
  trace({
    kind: "turn_start",
    conversationId,
    historyLength: history.length,
    messageLength: message.length,
  });

  // Route AFTER persisting the user message and reloading: the
  // router sees the full, up-to-date history.
  const { agent: agentName } = await routeIntent(
    history.slice(0, -1), // history without the just-saved message
    message,
  );
  const agent = agents[agentName as AgentName];

  const today = new Date().toISOString().slice(0, 10);

  const result = streamText({
    model: agent.model,
    system: agent.system(today),
    messages: history.map((m) => ({
      role: m.role,
      content: m.content,
    })),
    tools: agent.tools,
    stopWhen: stepCountIs(5),
    temperature: 0.3,
  });

  c.header("X-Conversation-Id", conversationId);
  c.header("X-Agent", agentName);

  return stream(c, async (s) => {
    let assistantText = "";
    for await (const chunk of result.textStream) {
      assistantText += chunk;
      await s.write(chunk);
    }
    if (assistantText.trim().length > 0) {
      await saveMessage(conversationId, "assistant", assistantText);
    }

    // Wait for finalUsage to settle, then trace the full turn.
    const usage = await result.usage;
    const inputTokens = usage.inputTokens ?? 0;
    const outputTokens = usage.outputTokens ?? 0;
    trace({
      kind: "turn_end",
      conversationId,
      agent: agentName,
      latencyMs: Date.now() - turnStart,
      inputTokens,
      outputTokens,
      assistantLength: assistantText.length,
      // Cost is in USD. We pretty-print downstream — keep it
      // raw here for aggregation.
      costUsd: estimateCost(
        "gemini-2.5-flash",
        inputTokens,
        outputTokens,
      ),
    });
  });
});
