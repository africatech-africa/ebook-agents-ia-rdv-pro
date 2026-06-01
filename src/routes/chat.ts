// src/routes/chat.ts — POST /chat with multi-agent routing + trace.
//
// Chapter 9 added routing to one of three specialists. Chapter 11
// adds observability: a structured `trace` event at the start and
// end of every turn (router choice is traced inside the router).
// Traces go to stderr as JSONL, leaving stdout free for the
// streamed response.

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

export const chatRoute = new Hono();

const agents = {
  booking: bookingAgent,
  support: supportAgent,
  marketing: marketingAgent,
} as const;

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

  const conversationId =
    body.conversationId ?? newConversationId();
  await saveMessage(conversationId, "user", message);
  const history = await loadHistory(conversationId);

  const turnStart = Date.now();
  trace({
    kind: "turn_start",
    conversationId,
    historyLength: history.length,
    messageLength: message.length,
  });

  const { agent: agentName } = await routeIntent(
    history.slice(0, -1),
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

    const usage = await result.usage;
    trace({
      kind: "turn_end",
      conversationId,
      agent: agentName,
      latencyMs: Date.now() - turnStart,
      inputTokens: usage.inputTokens ?? 0,
      outputTokens: usage.outputTokens ?? 0,
      assistantLength: assistantText.length,
    });
  });
});
