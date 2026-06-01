// src/db/seed.ts — fill the local SQLite database with demo data.
//
// Run it with:  npm run seed
//
// Generates a week of slots (Sundays closed) and pre-books a few of
// them, so getSlots returns a realistic, varied result.

import { readFileSync } from "node:fs";
import { db } from "./client";

const schema = readFileSync(
  new URL("./schema.sql", import.meta.url),
  "utf8",
);

db.exec("DROP TABLE IF EXISTS slots;");
db.exec(schema);

const HOURS = ["09:00", "10:00", "11:00", "12:00",
               "14:00", "15:00", "16:00", "17:00"];

const insert = db.prepare(
  "INSERT INTO slots (slot_date, slot_time, status, client_name) " +
    "VALUES (?, ?, ?, ?)",
);

// A few pre-booked slots, keyed by "offset:time", to make the
// demo data look real (some clients already booked).
const booked: Record<string, string> = {
  "0:10:00": "Awa Traoré",
  "1:15:00": "Fatou Diallo",
  "2:09:00": "Mariam Koné",
};

// 7 days from today, Sundays excluded.
for (let offset = 0; offset < 7; offset++) {
  const day = new Date();
  day.setDate(day.getDate() + offset);
  if (day.getDay() === 0) continue; // closed on Sundays
  const dateStr = day.toISOString().slice(0, 10);
  for (const time of HOURS) {
    const client = booked[`${offset}:${time}`] ?? null;
    const status = client ? "booked" : "free";
    insert.run(dateStr, time, status, client);
  }
}

const count = db
  .prepare("SELECT COUNT(*) AS n FROM slots")
  .get() as { n: number };
console.log(`Seed done — ${count.n} slots in rdv-pro.db.`);
