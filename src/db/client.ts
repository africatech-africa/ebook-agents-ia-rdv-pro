// src/db/client.ts — shared SQLite connection.
//
// One Database instance, exported. Every module that needs the
// database imports `db` from here. WAL mode improves concurrent
// reads at no cost.

import Database from "better-sqlite3";

export const db = new Database("rdv-pro.db");
db.pragma("journal_mode = WAL");
