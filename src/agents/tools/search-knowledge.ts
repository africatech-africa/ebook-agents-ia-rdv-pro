// src/agents/tools/search-knowledge.ts — Vercel AI SDK wrapper.
//
// Thin wrapper around `findRelevantChunks`. The pure logic lives
// in `src/agents/logic/find-knowledge.ts` so the MCP server
// (chapter 10) can call the same code.

import { tool } from "ai";
import { z } from "zod";
import { findRelevantChunks } from "../logic/find-knowledge";

export const searchKnowledge = tool({
  description:
    "Cherche dans la base de connaissances du salon (services, " +
    "prix, politique d'annulation, FAQ, infos pratiques). Renvoie " +
    "les passages les plus pertinents pour la question, avec leur " +
    "source. À appeler avant toute réponse factuelle.",

  inputSchema: z.object({
    query: z
      .string()
      .min(3, "La requête doit faire au moins 3 caractères.")
      .describe(
        "Question reformulée en mots-clés ou en phrase courte. " +
          "Exemples : 'politique d annulation', 'prix tresses " +
          "longues', 'horaires samedi'.",
      ),
  }),

  execute: async ({ query }) => findRelevantChunks(query),
});
