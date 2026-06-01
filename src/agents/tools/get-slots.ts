import { tool } from "ai";
import { z } from "zod";
import { db } from "../../db/client";

type SlotRow = { slot_time: string };

export const getSlots = tool({
  description:
    "Liste les créneaux libres pour une date donnée. La date " +
    "doit être au format ISO YYYY-MM-DD. Renvoie un tableau " +
    "d'objets { date, time } trié par heure croissante.",

  inputSchema: z.object({
    date: z
      .string()
      .regex(
        /^\d{4}-\d{2}-\d{2}$/,
        "La date doit être au format YYYY-MM-DD",
      )
      .describe(
        "Date pour laquelle chercher les créneaux libres.",
      ),
  }),

  execute: async ({ date }) => {
    const rows = db
      .prepare(
        "SELECT slot_time FROM slots " +
          "WHERE slot_date = ? AND status = 'free' " +
          "ORDER BY slot_time",
      )
      .all(date) as SlotRow[];

    return rows.map((r) => ({ date, time: r.slot_time }));
  },
});
