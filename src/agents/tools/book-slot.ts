// src/agents/tools/book-slot.ts — Booking tool (write).
//
// Marks a (date, time) slot as booked for a given client. The SQL
// UPDATE only succeeds if the slot is currently 'free', so two
// concurrent bookings cannot both win — the second one gets back
// zero updated rows and a clean "not available" message.
//
// This is read+WRITE territory now: an agent that calls this tool is
// modifying the world. The system prompt MUST require explicit
// consent from the client before the model invokes it.
//
// Chapter 8: after a successful booking, the tool emits a
// `booking/created` event. Inngest fans the event out to the
// confirmation and reminder workflows — the LLM never sees that
// part of the system.

import { tool } from "ai";
import { z } from "zod";
import { sql } from "../../db/client";
import { inngest } from "../../inngest/client";

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
    // RETURNING tells us whether a row was actually updated. With
    // SQLite we used `.changes`; in Postgres, an empty result set
    // means the WHERE clause matched nothing (slot already booked
    // or non-existent).
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

    // Fire-and-forget event: confirmation and reminder workflows
    // pick it up from here. We `await` only to surface delivery
    // errors to the agent's trace — the actual work happens
    // asynchronously in Inngest.
    await inngest.send({
      name: "booking/created",
      data: { date, time, clientName },
    });

    return {
      success: true,
      message:
        `Rendez-vous confirmé pour ${clientName}, ` +
        `${date} à ${time}.`,
    };
  },
});
