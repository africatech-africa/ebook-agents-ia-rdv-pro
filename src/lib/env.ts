// src/lib/env.ts — Validate environment variables at startup.
//
// Chapter 12: instead of letting the app crash mid-conversation
// because `DATABASE_URL` is undefined, we check every required
// variable on boot and exit with a friendly error if anything is
// missing or malformed.
//
// `import "./env"` (from any entry-point) is enough — the schema
// runs as a side effect and short-circuits the process before
// any other module has a chance to read a bad value.

import "dotenv/config";
import { z } from "zod";

const Env = z.object({
  GOOGLE_GENERATIVE_AI_API_KEY: z
    .string()
    .min(20, "Set your Google AI Studio API key in .env"),
  DATABASE_URL: z
    .string()
    .url("DATABASE_URL must be a valid Postgres connection URL"),
  PORT: z.coerce.number().int().positive().default(3000),
  INNGEST_DEV: z.string().optional(),
  TRACE: z.enum(["on", "off"]).optional(),
});

const result = Env.safeParse(process.env);

if (!result.success) {
  console.error("Environment validation failed:");
  for (const issue of result.error.issues) {
    console.error(`  - ${issue.path.join(".")}: ${issue.message}`);
  }
  console.error("\nFix .env (see .env.example) and try again.");
  process.exit(1);
}

export const env = result.data;
