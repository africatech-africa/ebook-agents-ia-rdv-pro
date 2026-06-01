// src/db/messages.ts — Conversation history persistence.
//
// One row per message. The pair (conversation_id, id) defines the
// chronological order of messages within a conversation.
//
// We store only the *user* and *assistant final text* messages.
// Tool calls and tool results are not persisted at this stage —
// the next turn re-derives availability via the tools. A more
// complete implementation would store the full message sequence;
// it is mentioned as a variation in chapter 6.
//
// All functions are now async (chapter 7's migration to Postgres):
// the driver returns Promises, so call-sites must `await` them.

import { randomUUID } from "node:crypto";
import { sql } from "./client";

export type Role = "user" | "assistant";

export type StoredMessage = {
  role: Role;
  content: string;
};

export function newConversationId(): string {
  return randomUUID();
}

export async function loadHistory(
  conversationId: string,
): Promise<StoredMessage[]> {
  const rows = await sql`
    SELECT role, content
    FROM messages
    WHERE conversation_id = ${conversationId}
    ORDER BY id ASC
  `;
  return rows as StoredMessage[];
}

export async function saveMessage(
  conversationId: string,
  role: Role,
  content: string,
): Promise<void> {
  await sql`
    INSERT INTO messages (conversation_id, role, content)
    VALUES (${conversationId}, ${role}, ${content})
  `;
}
