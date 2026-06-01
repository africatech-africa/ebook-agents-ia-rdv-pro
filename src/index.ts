// src/index.ts — RDV-Pro entry point (HTTP server).
//
// Endpoints:
//   - GET  /health        → is the server up?
//   - POST /chat          → send a message, stream the reply.
//   - *    /api/inngest   → Inngest serve handler (ch. 8). Used by
//                           the Inngest dev server (and Inngest
//                           Cloud in production) to discover and
//                           invoke our workflow functions.
//
// Run it with:  npm run dev
// In another terminal:  npx inngest-cli@latest dev
// (and stop both with Ctrl+C)

// Validate env vars BEFORE importing anything that reads them.
// If something is missing or malformed, src/lib/env exits with a
// friendly message instead of letting the app crash mid-turn.
import { env } from "./lib/env";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { serve as inngestServe } from "inngest/hono";
import { chatRoute } from "./routes/chat";
import { healthRoute } from "./routes/health";
import { inngest } from "./inngest/client";
import {
  confirmBooking,
  remindBooking,
} from "./inngest/functions";

const app = new Hono();

app.route("/health", healthRoute);
app.route("/chat", chatRoute);

app.on(
  ["GET", "POST", "PUT"],
  "/api/inngest",
  inngestServe({
    client: inngest,
    functions: [confirmBooking, remindBooking],
  }),
);

const port = env.PORT;

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`RDV-Pro is running on http://localhost:${info.port}`);
});
