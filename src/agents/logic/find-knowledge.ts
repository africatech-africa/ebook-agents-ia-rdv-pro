// src/agents/logic/find-knowledge.ts — Pure RAG logic.
//
// Shared by the Vercel AI SDK tool (`searchKnowledge`) and the
// MCP server (`search_knowledge`). One implementation, two
// interfaces.
//
// Embeds the query, runs a cosine top-K search on
// `knowledge_chunks` and returns the rows with a similarity
// score. Framework-free.

import { sql } from "../../db/client";
import {
  embedText,
  vectorLiteral,
} from "../../lib/embeddings";

export type KnowledgeChunk = {
  source: string;
  content: string;
  similarity: number;
};

export async function findRelevantChunks(
  query: string,
  limit = 3,
): Promise<KnowledgeChunk[]> {
  const vec = vectorLiteral(await embedText(query));
  const rows = (await sql`
    SELECT
      source,
      content,
      1 - (embedding <=> ${vec}::vector) AS similarity
    FROM knowledge_chunks
    ORDER BY embedding <=> ${vec}::vector
    LIMIT ${limit}
  `) as KnowledgeChunk[];

  return rows.map((r) => ({
    source: r.source,
    content: r.content,
    similarity: Number(r.similarity.toFixed(3)),
  }));
}
