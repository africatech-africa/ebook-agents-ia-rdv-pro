import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { chatRoute } from "./routes/chat";
import { healthRoute } from "./routes/health";

const app = new Hono();

app.route("/health", healthRoute);
app.route("/chat", chatRoute);

const port = Number(process.env.PORT ?? 3000);

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`RDV-Pro is running on http://localhost:${info.port}`);
});
