// src/db/client.ts — Single Neon Postgres connection.
//
// Chapter 7 migrates from better-sqlite3 to Postgres. We use Neon's
// HTTP driver (`@neondatabase/serverless`) which talks to Postgres
// over HTTPS — no connection pool, no long-lived socket, no need
// for a separate process. Perfect for a small backend that runs
// anywhere (serverless or not).
//
// The exported `sql` is a tagged-template function: write SQL with
// `${value}` placeholders and the driver escapes them for you. It
// returns a Promise of rows. Older synchronous code (`db.prepare`)
// has been replaced project-wide.

import "dotenv/config";
import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL is not set. Copy .env.example to .env and " +
      "paste your Neon connection string.",
  );
}

export const sql = neon(process.env.DATABASE_URL);
