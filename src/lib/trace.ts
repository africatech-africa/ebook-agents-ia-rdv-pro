// src/lib/trace.ts — Minimal observability layer.
//
// One function: `trace({ kind, ... })`. Logs a JSON line per
// event to **stderr** (never stdout — that channel is reserved
// for HTTP streaming responses in the chat route and for
// JSON-RPC in the MCP server).
//
// Each entry carries a UTC timestamp and the caller's fields.
// You can pipe stderr to a file (`npm run dev 2>traces.log`),
// parse the JSONL offline, or ship it to Langfuse / your OTel
// backend — see the "Variations" section of chapter 11.
//
// Disable the noise during a quiet local session with the
// `TRACE=off` env var.

const enabled = process.env.TRACE !== "off";

type TraceEvent = {
  kind: string;
  [key: string]: unknown;
};

export function trace(event: TraceEvent): void {
  if (!enabled) return;
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    ...event,
  });
  // process.stderr.write avoids the "console" prefix that some
  // log harvesters add automatically.
  process.stderr.write(line + "\n");
}
