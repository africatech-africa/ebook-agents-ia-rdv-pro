// src/db/messages.ts — conversation history persistence (SQLite).
//
// One row per message. The pair (conversation_id, id) defines the
// chronological order within a conversation. We store only the user
// and assistant final-text messages; tool calls are re-derived next
// turn by re-running the tools.

import { randomUUID } from "node:crypto";
import { db } from "./client";

export type Role = "user" | "assistant";
export type StoredMessage = { role: Role; content: string };

export function newConversationId(): string {
  return randomUUID();
}

export function loadHistory(
  conversationId: string,
): StoredMessage[] {
  return db
    .prepare(
      "SELECT role, content FROM messages " +
        "WHERE conversation_id = ? ORDER BY id ASC",
    )
    .all(conversationId) as StoredMessage[];
}

export function saveMessage(
  conversationId: string,
  role: Role,
  content: string,
): void {
  db.prepare(
    "INSERT INTO messages (conversation_id, role, content) " +
      "VALUES (?, ?, ?)",
  ).run(conversationId, role, content);
}
