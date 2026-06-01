// src/generate-descriptions.ts — First real LLM call.
//
// For each service in the salon's catalogue, ask Gemini Flash to
// produce a short commercial description in French. The script also
// reports the tokens used and the total latency — what you would
// also see on your Google AI Studio dashboard.
//
// Run it with:  npm run generate-descriptions

import { generateText } from "ai";
import { google, FLASH } from "./lib/llm";

type Service = {
  name: string;
  durationMinutes: number;
  priceFCFA: number;
};

const services: Service[] = [
  { name: "Coupe femme", durationMinutes: 45, priceFCFA: 8000 },
  { name: "Tresses", durationMinutes: 180, priceFCFA: 25000 },
  { name: "Manucure", durationMinutes: 60, priceFCFA: 10000 },
];

// The "system prompt" sets the role and the rules of the model.
// It is sent once and frames every reply, separately from the user
// prompt.
const systemPrompt = `Tu rédiges des descriptions commerciales pour un
salon de beauté à Abidjan. Ton ton est chaleureux et professionnel.
Une description = une seule phrase, en français, qui donne envie de
réserver. 20 mots maximum.`;

async function describe(service: Service) {
  const { text, usage } = await generateText({
    model: google(FLASH),
    system: systemPrompt,
    prompt:
      `Prestation : ${service.name} ` +
      `(${service.durationMinutes} min, ${service.priceFCFA} FCFA).`,
    temperature: 0.7,
    // Gemini 2.5 thinks before answering by default. For a one-shot
    // copywriting task that is wasteful (latency + tokens), so we
    // turn it off explicitly. We will keep thinking ON later, when
    // the agent has to reason across multiple tool calls.
    providerOptions: {
      google: {
        thinkingConfig: { thinkingBudget: 0 },
      },
    },
  });
  return { description: text.trim(), usage };
}

async function main() {
  console.log("Génération des descriptions commerciales...\n");
  let inputTokens = 0;
  let outputTokens = 0;
  const t0 = Date.now();

  for (const service of services) {
    const { description, usage } = await describe(service);
    console.log(`▸ ${service.name}`);
    console.log(`  ${description}\n`);
    inputTokens += usage.inputTokens ?? 0;
    outputTokens += usage.outputTokens ?? 0;
  }

  console.log(
    `Tokens — in: ${inputTokens}, out: ${outputTokens}, ` +
      `total: ${inputTokens + outputTokens}`,
  );
  console.log(`Latence totale : ${Date.now() - t0} ms`);
}

main().catch((err) => {
  console.error("Erreur:", err);
  process.exit(1);
});
