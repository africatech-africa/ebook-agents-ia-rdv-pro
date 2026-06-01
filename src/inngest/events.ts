// src/inngest/events.ts — Typed event definitions.
//
// `eventType` is the Inngest v4 way to declare a typed event. The
// schema is a Standard Schema (Zod, Valibot, ArkType all qualify):
// it validates at runtime AND gives TypeScript the exact shape of
// `event.data` in the workflow handler.
//
// Both the producer (the bookSlot tool) and the consumers
// (workflows) import from here, so there's a single source of
// truth for the event payload.

import { eventType } from "inngest";
import { z } from "zod";

export const bookingCreated = eventType("booking/created", {
  schema: z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    time: z.string().regex(/^\d{2}:\d{2}$/),
    clientName: z.string().min(2),
  }),
});
