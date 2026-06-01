// src/db/seed-knowledge.ts — Ingest the salon knowledge base.
//
// Reads every markdown file under `knowledge/`, splits it into
// chunks (one chunk per H2 section), embeds them all in a single
// batched API call, and inserts the result into
// `knowledge_chunks`. Idempotent: the table is wiped first, so a
// re-run gives a clean state.
//
// Run it with:  npm run seed:knowledge
//
// Cost is tiny — a few thousand input tokens total for our ~20
// chunks, and embeddings on text-embedding-004 are free on the AI
// Studio tier.

import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { sql } from "./client";
import { ensureSchema } from "./schema";
import { embedTexts, vectorLiteral } from "../lib/embeddings";

type Chunk = { source: string; content: string };

const here = dirname(fileURLToPath(import.meta.url));
const KNOWLEDGE_DIR = join(here, "..", "..", "knowledge");

function splitMarkdown(filename: string, raw: string): Chunk[] {
  // Each H2 section becomes one chunk. The H1 title at the top of
  // each file is dropped (it is not a queryable section).
  const parts = raw.split(/^## /m);
  // First part is the H1 + intro before any H2: ignore it.
  return parts.slice(1).map((part) => {
    const firstNewline = part.indexOf("\n");
    const heading = part.slice(0, firstNewline).trim();
    const body = part.slice(firstNewline + 1).trim();
    return {
      source: `${filename}#${heading}`,
      content: `${heading}\n\n${body}`,
    };
  });
}

async function main() {
  await ensureSchema();
  await sql`TRUNCATE TABLE knowledge_chunks RESTART IDENTITY`;

  // 1. Load and chunk every .md file.
  const files = readdirSync(KNOWLEDGE_DIR)
    .filter((f) => f.endsWith(".md"))
    .sort();
  const chunks: Chunk[] = [];
  for (const file of files) {
    const raw = readFileSync(join(KNOWLEDGE_DIR, file), "utf-8");
    chunks.push(...splitMarkdown(file, raw));
  }
  console.log(`${chunks.length} chunks à indexer.`);

  // 2. Batch-embed everything in one API call.
  const t0 = Date.now();
  const embeddings = await embedTexts(chunks.map((c) => c.content));
  console.log(`Embeddings calculés en ${Date.now() - t0} ms.`);

  // 3. INSERT each chunk with its vector.
  for (let i = 0; i < chunks.length; i++) {
    const { source, content } = chunks[i];
    const vec = vectorLiteral(embeddings[i]);
    await sql`
      INSERT INTO knowledge_chunks (source, content, embedding)
      VALUES (${source}, ${content}, ${vec}::vector)
    `;
  }
  console.log(`Indexation terminée : ${chunks.length} chunks en base.`);
}

main().catch((err) => {
  console.error("Seed knowledge failed:", err);
  process.exit(1);
});
