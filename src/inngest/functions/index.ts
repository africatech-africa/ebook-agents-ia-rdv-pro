// src/inngest/functions/index.ts — Barrel of all workflows.
//
// Every function defined here is registered with Inngest via the
// /api/inngest route. Add new files to the same directory and
// re-export them from here.

export { confirmBooking } from "./confirm-booking";
export { remindBooking } from "./remind-booking";
