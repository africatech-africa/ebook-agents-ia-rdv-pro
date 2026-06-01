import { tool } from "ai";
import { z } from "zod";
import { db } from "../../db/client";

export const bookSlot = tool({
  description:
    "Réserve un créneau pour une cliente identifiée. Renvoie " +
    "{ success: true, message } si la réservation passe, ou " +
    "{ success: false, message } si le créneau n'est plus libre.",

  inputSchema: z.object({
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .describe("Jour du rendez-vous (YYYY-MM-DD)."),
    time: z
      .string()
      .regex(/^\d{2}:\d{2}$/)
      .describe("Heure du rendez-vous (HH:MM, 24h)."),
    clientName: z
      .string()
      .min(2)
      .describe("Nom (et prénom si possible) de la cliente."),
  }),

  execute: async ({ date, time, clientName }) => {
    // The UPDATE only matches a slot that is still 'free', so two
    // concurrent bookings cannot both win: the second one gets back
    // zero changed rows and a clean "not available" message.
    const result = db
      .prepare(
        "UPDATE slots SET status='booked', client_name=? " +
          "WHERE slot_date=? AND slot_time=? " +
          "AND status='free'",
      )
      .run(clientName, date, time);

    if (result.changes === 0) {
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
