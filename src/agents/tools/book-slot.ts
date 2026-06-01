import { tool } from "ai";
import { z } from "zod";
import { sql } from "../../db/client";

export const bookSlot = tool({
  description:
    "Réserve un créneau pour une cliente identifiée. Renvoie " +
    "{ success: true, message } si la réservation passe, ou " +
    "{ success: false, message } si le créneau n'est plus libre.",

  inputSchema: z.object({
    date: z
      .string()
      .regex(
        /^\d{4}-\d{2}-\d{2}$/,
        "La date doit être au format YYYY-MM-DD",
      )
      .describe("Jour du rendez-vous (YYYY-MM-DD)."),
    time: z
      .string()
      .regex(/^\d{2}:\d{2}$/, "L'heure doit être au format HH:MM")
      .describe("Heure du rendez-vous (HH:MM, 24h)."),
    clientName: z
      .string()
      .min(2, "Le nom de la cliente est obligatoire.")
      .describe("Nom (et prénom si possible) de la cliente."),
  }),

  execute: async ({ date, time, clientName }) => {
    // RETURNING tells us whether a row was actually updated. An
    // empty result set means the WHERE clause matched nothing
    // (slot already booked or non-existent).
    const updated = await sql`
      UPDATE slots
      SET status = 'booked',
          client_name = ${clientName}
      WHERE slot_date = ${date}::DATE
        AND slot_time = ${time}::TIME
        AND status = 'free'
      RETURNING id
    `;

    if (updated.length === 0) {
      return {
        success: false,
        message:
          `Créneau ${date} ${time} indisponible ` +
          `(déjà réservé ou inexistant).`,
      };
    }

    return {
      success: true,
      message:
        `Rendez-vous confirmé pour ${clientName}, ` +
        `${date} à ${time}.`,
    };
  },
});
