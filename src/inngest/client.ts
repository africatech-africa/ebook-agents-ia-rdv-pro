// src/inngest/client.ts — Single Inngest client for the project.
//
// The client is the publish/subscribe handle: every call to
// `inngest.send(...)` goes through it, and every function
// registered via `inngest.createFunction(...)` listens on it.
//
// Event types live in `./events.ts` — using a typed `eventType`
// gives us auto-completion and runtime validation on both sides
// of the wire.

import { Inngest } from "inngest";

export const inngest = new Inngest({ id: "rdv-pro" });
