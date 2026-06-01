// src/routes/health.ts — Health check endpoint.
//
// A trivial GET /health that always returns { status: "ok" }.
// Useful for uptime monitoring and for "is the server actually up?".

import { Hono } from "hono";

export const healthRoute = new Hono();

healthRoute.get("/", (c) => c.json({ status: "ok" }));
