import { Hono } from "hono";
import { stream } from "hono/streaming";
import { streamText, stepCountIs } from "ai";
import { google, FLASH } from "../lib/llm";
import { getSlots } from "../agents/tools/get-slots";
import { bookSlot } from "../agents/tools/book-slot";
import { searchKnowledge } from "../agents/tools/search-knowledge";
import {
  loadHistory,
  newConversationId,
  saveMessage,
} from "../db/messages";

export const chatRoute = new Hono();

function buildSystemPrompt(today: string): string {
  return `Tu es l'assistant du salon Élégance, à Abidjan. Tu réponds
aux clientes en français, avec un ton chaleureux et concis.

La date du jour est ${today} (format YYYY-MM-DD).

OUTILS DISPONIBLES :
- getSlots(date)               : créneaux libres d'une date.
- bookSlot(date, time, name)   : RÉSERVE un créneau pour une
  cliente nommée.
- searchKnowledge(query)       : cherche dans les infos du salon
  (services, prix, politique d'annulation, FAQ).

RÈGLES IMPÉRATIVES :
- Pour TOUTE question sur les disponibilités, appelle getSlots
  AVANT de répondre.
- Pour TOUTE question sur les services, prix ou politiques,
  appelle searchKnowledge et réponds UNIQUEMENT avec ce qu'il
  renvoie. Si rien n'est pertinent, dis-le honnêtement.
- N'utilise bookSlot QUE si la cliente a explicitement demandé
  de réserver ET t'a donné un nom. Sinon, demande l'info manquante.
- N'invente JAMAIS un créneau, un prix, un horaire ou un nom.
- Après un bookSlot réussi, confirme avec date, heure et nom.`;
}

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

  // DB calls are async now (Postgres). Persist, then reload.
  const conversationId =
    body.conversationId ?? newConversationId();
  await saveMessage(conversationId, "user", message);
  const history = await loadHistory(conversationId);

  const today = new Date().toISOString().slice(0, 10);

  const result = streamText({
    model: google(FLASH),
    system: buildSystemPrompt(today),
    messages: history.map((m) => ({
      role: m.role,
      content: m.content,
    })),
    tools: { getSlots, bookSlot, searchKnowledge },
    stopWhen: stepCountIs(5),
    temperature: 0.3,
  });

  c.header("X-Conversation-Id", conversationId);

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
