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

const port = Number(process.env.PORT ?? 3000);

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`RDV-Pro is running on http://localhost:${info.port}`);
});
