// src/db/seed.ts — Populate the Postgres database with demo data.
//
// Run it with:  npm run seed
//
// Ensures the schema, wipes the booking-related tables, then
// regenerates appointment slots for the next 7 days (skipping
// Sundays) — hourly from 09:00 to 17:00 with a lunch break at 13:00.
// A handful of slots are pre-booked with realistic French-speaking
// client names, so the getSlots tool of chapter 4 has something
// useful to return.
//
// The knowledge_chunks table is seeded by a separate script
// (`npm run seed:knowledge`, chapter 7) because it makes one
// embedding API call per chunk.

import { sql } from "./client";
import { ensureSchema } from "./schema";

const HOURS = [
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
];

// Hardcoded bookings to make availability realistic.
// Keys are "<dayOffset>:<HH:MM>".
const bookings = new Set([
  "0:10:00",
  "0:14:00",
  "1:09:00",
  "1:15:00",
  "3:11:00",
]);

const clientNames = [
  "Awa Diop",
  "Fatou Traoré",
  "Mariam K.",
  "Aïcha B.",
  "Sophie L.",
];

async function main() {
  await ensureSchema();

  // Wipe ONLY the booking tables. Knowledge stays — it is expensive
  // to recompute and changes rarely.
  await sql`TRUNCATE TABLE slots RESTART IDENTITY`;
  await sql`TRUNCATE TABLE messages RESTART IDENTITY`;

  const today = new Date();
  let inserted = 0;
  let booked = 0;
  let clientIdx = 0;

  for (let offset = 0; offset < 7; offset++) {
    const day = new Date(today);
    day.setDate(day.getDate() + offset);
    if (day.getDay() === 0) continue; // Sundays: salon closed.
    const dateStr = day.toISOString().slice(0, 10);

    for (const time of HOURS) {
      const key = `${offset}:${time}`;
      if (bookings.has(key)) {
        const name = clientNames[clientIdx % clientNames.length];
        await sql`
          INSERT INTO slots (slot_date, slot_time, status, client_name)
          VALUES (${dateStr}::DATE, ${time}::TIME, 'booked', ${name})
        `;
        clientIdx++;
        booked++;
      } else {
        await sql`
          INSERT INTO slots (slot_date, slot_time, status, client_name)
          VALUES (${dateStr}::DATE, ${time}::TIME, 'free', NULL)
        `;
      }
      inserted++;
    }
  }

  console.log(
    `Seed terminé : ${inserted} créneaux (${booked} déjà réservés).`,
  );
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
