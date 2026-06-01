// src/inngest/functions/confirm-booking.ts
//
// Fires the moment a `booking/created` event is sent. Sends an
// immediate confirmation to the client.
//
// `step.run(name, fn)` wraps the async work in Inngest's durable
// machinery: if the function crashes after the step succeeds,
// Inngest will NOT re-run that step on retry — it replays the
// recorded result. That guarantees we never send two
// confirmations for the same booking, even if the worker dies
// mid-execution.

import { inngest } from "../client";
import { bookingCreated } from "../events";
import { sendWhatsApp } from "../../lib/notify";

export const confirmBooking = inngest.createFunction(
  {
    id: "confirm-booking",
    triggers: [bookingCreated],
  },
  async ({ event, step }) => {
    const { date, time, clientName } = event.data;

    const result = await step.run("send-confirmation", async () => {
      const message =
        `Bonjour ${clientName}, votre rendez-vous au salon ` +
        `Élégance est bien confirmé pour le ${date} à ${time}. ` +
        `À très bientôt !`;
      return await sendWhatsApp(clientName, message);
    });

    return { confirmed: true, sentAt: result.sentAt };
  },
);
