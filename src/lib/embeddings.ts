// src/lib/embeddings.ts — Google text embeddings (chapter 7).
//
// Model: gemini-embedding-001 with outputDimensionality = 768.
// The default would be 3072 — overkill for our small corpus, and
// 4x more bytes per row. 768 keeps storage tight without hurting
// retrieval quality on this kind of content.
//
// `taskType` matters: Google's embedding model embeds the same
// text differently depending on its role. Use RETRIEVAL_DOCUMENT
// when indexing chunks, RETRIEVAL_QUERY when embedding the user's
// question. Mixing them silently degrades accuracy.
//
// `vectorLiteral` formats an embedding for pgvector — see the
// `${vec}::vector` cast in seed-knowledge and search-knowledge.

import { embed, embedMany } from "ai";
import { google } from "./llm";

export const EMBEDDING_MODEL = "gemini-embedding-001";
export const EMBEDDING_DIM = 768;

const model = google.textEmbeddingModel(EMBEDDING_MODEL);

type TaskType = "RETRIEVAL_DOCUMENT" | "RETRIEVAL_QUERY";

function providerOptions(taskType: TaskType) {
  return {
    google: {
      outputDimensionality: EMBEDDING_DIM,
      taskType,
    },
  };
}

export async function embedText(text: string): Promise<number[]> {
  const { embedding } = await embed({
    model,
    value: text,
    providerOptions: providerOptions("RETRIEVAL_QUERY"),
  });
  return embedding;
}

export async function embedTexts(
  texts: string[],
): Promise<number[][]> {
  const { embeddings } = await embedMany({
    model,
    values: texts,
    providerOptions: providerOptions("RETRIEVAL_DOCUMENT"),
  });
  return embeddings;
}

export function vectorLiteral(embedding: number[]): string {
  // pgvector accepts the literal '[1,2,3]'. JSON.stringify gives us
  // exactly that.
  return JSON.stringify(embedding);
}
