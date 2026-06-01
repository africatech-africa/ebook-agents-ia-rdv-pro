// src/agents/logic/find-slots.ts — Pure logic for slot lookup.
//
// Chapter 10 separates "what the tool does" from "how it is
// exposed". The Vercel AI SDK tool and the MCP tool both call
// `findFreeSlots` — same SQL, same return shape, two interfaces.
//
// Keep this file UI-free and framework-free: no Zod, no AI SDK
// imports, just data in / data out.

import { sql } from "../../db/client";

export type Slot = { date: string; time: string };

export async function findFreeSlots(date: string): Promise<Slot[]> {
  const rows = (await sql`
    SELECT TO_CHAR(slot_time, 'HH24:MI') AS slot_time
    FROM slots
    WHERE slot_date = ${date}::DATE
      AND status = 'free'
    ORDER BY slot_time
  `) as { slot_time: string }[];

  return rows.map((r) => ({ date, time: r.slot_time }));
}
