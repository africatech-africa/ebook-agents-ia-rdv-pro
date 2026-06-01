// src/agents/tools/get-slots.ts — Vercel AI SDK wrapper.
//
// Thin wrapper around `findFreeSlots`. Chapter 10 split the pure
// logic out so the same query can also be exposed as an MCP tool
// — see `src/mcp/server.ts`.

import { tool } from "ai";
import { z } from "zod";
import { findFreeSlots } from "../logic/find-slots";

export const getSlots = tool({
  description:
    "Liste les créneaux libres pour une date donnée. La date doit " +
    "être au format ISO YYYY-MM-DD. Renvoie un tableau d'objets " +
    "{ date, time } trié par heure croissante.",

  inputSchema: z.object({
    date: z
      .string()
      .regex(
        /^\d{4}-\d{2}-\d{2}$/,
        "La date doit être au format YYYY-MM-DD",
      )
      .describe("Date pour laquelle chercher les créneaux libres."),
  }),

  execute: async ({ date }) => findFreeSlots(date),
});
