// src/routes/chat.ts — POST /chat with multi-agent routing.
//
// Chapter 9: instead of a single all-purpose agent, the request is
// first classified by the router (one small LLM call), then
// dispatched to ONE of three specialists (booking, support,
// marketing). Each specialist owns its tools and its system prompt.
// The conversation history is shared, so the active agent can
// change between turns and still see everything said before.
//
// The chosen agent name is returned in the X-Agent header so the
// client can show a "transferred to support" hint if useful.

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

  // Route AFTER persisting and reloading: the router sees the full
  // history (minus the just-saved message, passed separately).
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
  });
});
