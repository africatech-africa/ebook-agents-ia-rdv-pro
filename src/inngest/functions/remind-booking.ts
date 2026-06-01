// src/inngest/functions/remind-booking.ts
//
// Schedules a WhatsApp reminder for the day before the appointment
// at 18:00 (Abidjan local time). The function listens on the same
// `booking/created` event as `confirmBooking`; Inngest fans the
// event out to every matching function.
//
// `step.sleepUntil(name, date)` is the magic: Inngest serialises
// the function state, releases the worker, and resumes execution
// at the target moment — even if the server has been restarted
// or redeployed in the meantime. We do NOT keep a long-lived
// process holding a setTimeout.

import { inngest } from "../client";
import { bookingCreated } from "../events";
import { sendWhatsApp } from "../../lib/notify";

function dayBeforeAt18h(date: string): Date {
  // Appointment date is YYYY-MM-DD. We don't model timezones in
  // the demo — Abidjan is UTC (no DST), so a naive UTC date works.
  const day = new Date(`${date}T00:00:00Z`);
  day.setUTCDate(day.getUTCDate() - 1);
  day.setUTCHours(18, 0, 0, 0);
  return day;
}

export const remindBooking = inngest.createFunction(
  {
    id: "remind-booking",
    triggers: [bookingCreated],
  },
  async ({ event, step }) => {
    const { date, time, clientName } = event.data;

    const reminderAt = dayBeforeAt18h(date);
    if (reminderAt.getTime() < Date.now()) {
      // Booking is for tomorrow or today: skip the reminder.
      return {
        skipped: true,
        reason: "reminder time already passed",
      };
    }

    await step.sleepUntil("wait-until-day-before-18h", reminderAt);

    const result = await step.run("send-reminder", async () => {
      const message =
        `Petit rappel, ${clientName} : votre rendez-vous au ` +
        `salon Élégance est demain à ${time}. Merci de prévenir ` +
        `en cas d'imprévu (annulation gratuite jusqu'à 24 h avant).`;
      return await sendWhatsApp(clientName, message);
    });

    return { reminded: true, sentAt: result.sentAt };
  },
);
