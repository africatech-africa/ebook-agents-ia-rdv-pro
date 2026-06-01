// src/db/schema.ts — Idempotent Postgres schema setup.
//
// All `CREATE` statements use `IF NOT EXISTS`: calling `ensureSchema()`
// twice is safe. The seed script runs it first, so a fresh clone of
// the project just works.
//
// Two new things compared to the SQLite version of chapter 4:
//   1. The `vector` extension (pgvector), which adds the `VECTOR(n)`
//      column type and the distance operators (`<=>`, `<->`, `<#>`).
//   2. A `knowledge_chunks` table where each row stores a short text
//      passage and its embedding — the heart of the RAG pipeline.

import { sql } from "./client";

export async function ensureSchema(): Promise<void> {
  // Enable pgvector. Neon ships it pre-installed at the binary level;
  // we just have to expose it in the current database.
  await sql`CREATE EXTENSION IF NOT EXISTS vector`;

  await sql`
    CREATE TABLE IF NOT EXISTS slots (
      id          SERIAL PRIMARY KEY,
      slot_date   DATE   NOT NULL,
      slot_time   TIME   NOT NULL,
      status      TEXT   NOT NULL
                  CHECK (status IN ('free', 'booked')),
      client_name TEXT,
      UNIQUE (slot_date, slot_time)
    )
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS slots_date_status_idx
      ON slots(slot_date, status)
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS messages (
      id              SERIAL      PRIMARY KEY,
      conversation_id TEXT        NOT NULL,
      role            TEXT        NOT NULL
                      CHECK (role IN ('user', 'assistant')),
      content         TEXT        NOT NULL,
      created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS messages_conv_idx
      ON messages(conversation_id, id)
  `;

  // VECTOR(768) matches the output of Google's text-embedding-004.
  // If you switch to a model with a different dimensionality, drop
  // and recreate this table — pgvector dimensions are fixed.
  await sql`
    CREATE TABLE IF NOT EXISTS knowledge_chunks (
      id          SERIAL       PRIMARY KEY,
      source      TEXT         NOT NULL,
      content     TEXT         NOT NULL,
      embedding   VECTOR(768)  NOT NULL,
      created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
    )
  `;
}
