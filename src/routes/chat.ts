import { Hono } from "hono";
import { stream } from "hono/streaming";
import { streamText, stepCountIs } from "ai";
import { google, FLASH } from "../lib/llm";
import { getSlots } from "../agents/tools/get-slots";
import { bookSlot } from "../agents/tools/book-slot";

export const chatRoute = new Hono();

// Hardened system prompt: the model now has a WRITE tool (bookSlot),
// so the rules must forbid hallucinated confirmations and require
// explicit consent + a client name before booking.
function buildSystemPrompt(today: string): string {
  return `Tu es l'assistant du salon Élégance, à Abidjan. Tu réponds
aux clientes en français, avec un ton chaleureux et concis.

La date du jour est ${today} (format YYYY-MM-DD).

OUTILS DISPONIBLES :
- getSlots(date)               : liste les créneaux libres d'une
  date (format YYYY-MM-DD).
- bookSlot(date, time, name)   : RÉSERVE un créneau pour une
  cliente nommée.

RÈGLES IMPÉRATIVES :
- Pour TOUTE question sur les disponibilités, appelle getSlots
  AVANT de répondre.
- N'utilise bookSlot QUE si la cliente a explicitement demandé
  de réserver ET t'a donné un nom (prénom + nom de préférence).
  Si l'une des deux infos manque, demande-la — ne réserve pas.
- N'invente JAMAIS un créneau, un horaire ou un nom.
- Après un appel bookSlot réussi, confirme à la cliente avec la
  date, l'heure et son nom.`;
}

chatRoute.post("/", async (c) => {
  const body = await c.req.json<{ message?: string }>();
  const message = body.message;

  if (typeof message !== "string" || message.trim().length === 0) {
    return c.json(
      { error: "Body must contain a non-empty 'message'." },
      400,
    );
  }

  const today = new Date().toISOString().slice(0, 10);

  const result = streamText({
    model: google(FLASH),
    system: buildSystemPrompt(today),
    prompt: message,
    tools: { getSlots, bookSlot },
    stopWhen: stepCountIs(5),
    temperature: 0.3,
  });

  return stream(c, async (s) => {
    for await (const chunk of result.textStream) {
      await s.write(chunk);
    }
  });
});
