import { Hono } from "hono";
import { stream } from "hono/streaming";
import { streamText } from "ai";
import { google, FLASH } from "../lib/llm";

export const chatRoute = new Hono();

const systemPrompt = `Tu es l'assistant du salon Élégance, à Abidjan.
Tu réponds aux clientes en français, avec un ton chaleureux et
concis. Tu ne connais PAS encore les créneaux ni les prix réels :
si on te les demande, tu réponds que tu vérifies l'agenda et reviens
vers la cliente. Pas plus de trois phrases par réponse.`;

chatRoute.post("/", async (c) => {
  const body = await c.req.json<{ message?: string }>();
  const message = body.message;

  if (typeof message !== "string" || message.trim().length === 0) {
    return c.json(
      { error: "Body must contain a non-empty 'message'." },
      400,
    );
  }

  const result = streamText({
    model: google(FLASH),
    system: systemPrompt,
    prompt: message,
    temperature: 0.3,
  });

  return stream(c, async (s) => {
    for await (const chunk of result.textStream) {
      await s.write(chunk);
    }
  });
});
