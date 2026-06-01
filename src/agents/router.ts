// src/agents/router.ts — Intent classifier (a small LLM call).
//
// Looks at the recent conversation + the new user message, picks
// ONE of three specialists, and returns the choice. We use
// `generateObject` with a Zod enum so the model is forced to
// answer with a valid agent name (no free-text routing bugs).
//
// Cost: one Gemini Flash call per turn. We disable thinking
// because routing is a one-shot classification — no chain of
// reasoning required.

import { generateObject } from "ai";
import { z } from "zod";
import { google, FLASH } from "../lib/llm";
import { trace } from "../lib/trace";

export type AgentName = "booking" | "support" | "marketing";

const RouterDecision = z.object({
  agent: z.enum(["booking", "support", "marketing"]),
  reason: z.string().describe("Short reason in French, one sentence."),
});

const SYSTEM = `Tu es un classifieur d'intentions pour le salon
Élégance. Tu lis la conversation et la nouvelle question de la
cliente, et tu choisis UN agent spécialisé parmi :

- "booking"   → la cliente veut PRENDRE un rendez-vous, connaître
  les créneaux libres, ou poser une question sur les prix /
  services qui mène vers une réservation.
- "support"   → la cliente veut ANNULER ou modifier un rendez-vous
  existant, signaler un retard, faire une réclamation, ou pose
  une question sur la politique d'annulation.
- "marketing" → la cliente veut savoir les promotions, recevoir
  une recommandation de service, parler des cartes cadeaux ou
  nouveautés, sans intention claire de réserver tout de suite.

En cas de doute, préfère "booking" (le cœur du salon).`;

function formatHistory(
  history: { role: string; content: string }[],
): string {
  if (history.length === 0) return "(aucun message précédent)";
  // Keep the last 4 turns — enough context, not too much.
  return history
    .slice(-4)
    .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
    .join("\n");
}

export async function routeIntent(
  history: { role: string; content: string }[],
  message: string,
): Promise<{ agent: AgentName; reason: string }> {
  const t0 = Date.now();
  try {
    const { object } = await generateObject({
      model: google(FLASH),
      schema: RouterDecision,
      system: SYSTEM,
      prompt:
        `Historique récent :\n${formatHistory(history)}\n\n` +
        `Nouveau message : ${message}\n\n` +
        `Choisis l'agent.`,
      temperature: 0,
      providerOptions: {
        google: {
          thinkingConfig: { thinkingBudget: 0 },
        },
      },
    });
    trace({
      kind: "route",
      agent: object.agent,
      reason: object.reason,
      latencyMs: Date.now() - t0,
    });
    return object;
  } catch (err) {
    // Gemini occasionally returns malformed JSON despite a
    // structured-output schema. We do NOT fail the conversation —
    // we fall back to the most common case ("booking") so the
    // client still gets a useful reply, and we log the incident.
    trace({
      kind: "route_failure",
      fallback: "booking",
      message: message.slice(0, 80),
      latencyMs: Date.now() - t0,
      error: err instanceof Error ? err.message : String(err),
    });
    return { agent: "booking", reason: "router fallback" };
  }
}
