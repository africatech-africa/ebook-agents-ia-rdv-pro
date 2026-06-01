// src/agents/tools/cancel-booking.ts — Cancellation tool (write).
//
// Reverses a previous booking: sets the slot back to 'free' and
// clears the client_name. The UPDATE only succeeds if the row is
// currently booked under the exact client_name — so a client cannot
// accidentally cancel someone else's appointment by guessing a
// date and time.
//
// Like bookSlot, this is a WRITE: explicit consent from the client
// is required by the support agent's system prompt before the
// model invokes it.

import { tool } from "ai";
import { z } from "zod";
import { sql } from "../../db/client";
import { inngest } from "../../inngest/client";

export const cancelBooking = tool({
  description:
    "Annule un rendez-vous existant pour une cliente. Renvoie " +
    "{ success: true, message } si l'annulation passe, ou " +
    "{ success: false, message } si le créneau demandé n'est pas " +
    "réservé sous ce nom (ce qui indique souvent une erreur de " +
    "date, d'heure ou de nom).",

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
      .describe("Nom de la cliente sous lequel le RDV a été pris."),
  }),

  execute: async ({ date, time, clientName }) => {
    const updated = await sql`
      UPDATE slots
      SET status = 'free',
          client_name = NULL
      WHERE slot_date = ${date}::DATE
        AND slot_time = ${time}::TIME
        AND status = 'booked'
        AND client_name = ${clientName}
      RETURNING id
    `;

    if (updated.length === 0) {
      return {
        success: false,
        message:
          `Pas de rendez-vous trouvé au nom de ${clientName} ` +
          `le ${date} à ${time}.`,
      };
    }

    await inngest.send({
      name: "booking/cancelled",
      data: { date, time, clientName },
    });

    return {
      success: true,
      message:
        `Rendez-vous du ${date} à ${time} annulé pour ` +
        `${clientName}.`,
    };
  },
});
