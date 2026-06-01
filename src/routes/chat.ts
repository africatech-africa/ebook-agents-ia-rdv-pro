import { Hono } from "hono";
import { stream } from "hono/streaming";
import { streamText, stepCountIs } from "ai";
import { google, FLASH } from "../lib/llm";
import { getSlots } from "../agents/tools/get-slots";

export const chatRoute = new Hono();

// The system prompt is now directive: it tells the model that it
// has a tool to read real availability, and how to use it. Passing
// today's date avoids the model guessing what "tomorrow" means.
function buildSystemPrompt(today: string): string {
  return `Tu es l'assistant du salon Élégance, à Abidjan. Tu réponds
aux clientes en français, avec un ton chaleureux et concis.

La date du jour est ${today} (format YYYY-MM-DD).

Pour toute question sur les disponibilités, tu DOIS appeler l'outil
getSlots avec la date concernée — ne devine JAMAIS les créneaux.
Convertis les dates relatives ("demain", "samedi") en YYYY-MM-DD
avant d'appeler l'outil. Présente les créneaux libres simplement,
en heures locales. Pas plus de trois phrases.`;
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
    tools: { getSlots },
    stopWhen: stepCountIs(3),
    temperature: 0.3,
  });

  return stream(c, async (s) => {
    for await (const chunk of result.textStream) {
      await s.write(chunk);
    }
  });
});
