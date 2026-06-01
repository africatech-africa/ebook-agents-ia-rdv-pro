import { tool } from "ai";
import { z } from "zod";
import { sql } from "../../db/client";
import { embedText, vectorLiteral } from "../../lib/embeddings";

type ChunkRow = {
  source: string;
  content: string;
  similarity: number;
};

export const searchKnowledge = tool({
  description:
    "Cherche dans la base de connaissances du salon (services, " +
    "prix, politique d'annulation, FAQ, infos pratiques). Renvoie " +
    "les passages les plus pertinents pour la question.",

  inputSchema: z.object({
    query: z
      .string()
      .min(3)
      .describe(
        "Question reformulée en mots-clés ou en phrase courte.",
      ),
  }),

  execute: async ({ query }) => {
    const queryEmbedding = await embedText(query);
    const vec = vectorLiteral(queryEmbedding);

    const rows = (await sql`
      SELECT
        source,
        content,
        1 - (embedding <=> ${vec}::vector) AS similarity
      FROM knowledge_chunks
      ORDER BY embedding <=> ${vec}::vector
      LIMIT 3
    `) as ChunkRow[];

    return rows.map((r) => ({
      source: r.source,
      content: r.content,
      similarity: Number(r.similarity.toFixed(3)),
    }));
  },
});
