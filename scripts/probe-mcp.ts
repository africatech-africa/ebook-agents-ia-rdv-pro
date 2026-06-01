// scripts/probe-mcp.ts — One-off probe of the RDV-Pro MCP server.
//
// Spawns the MCP server as a child process, then opens an MCP
// session over its stdio. Sends `tools/list` and a `tools/call`
// for both exposed tools to confirm the wiring end to end.
// Throwaway — not part of the published code.

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const transport = new StdioClientTransport({
  command: "npx",
  args: ["tsx", "src/mcp/server.ts"],
  env: {
    // StdioClientTransport only inherits a small whitelist
    // (PATH, HOME, ...). Forward the secrets and the TLS root
    // bundle the server needs to reach Neon and Google over HTTPS.
    DATABASE_URL: process.env.DATABASE_URL!,
    GOOGLE_GENERATIVE_AI_API_KEY:
      process.env.GOOGLE_GENERATIVE_AI_API_KEY!,
    NODE_EXTRA_CA_CERTS: process.env.NODE_EXTRA_CA_CERTS ?? "",
    SSL_CERT_FILE: process.env.SSL_CERT_FILE ?? "",
  },
});

const client = new Client(
  { name: "probe-rdv-pro", version: "0.0.0" },
  { capabilities: {} },
);

await client.connect(transport);

const tools = await client.listTools();
console.log("=== tools/list ===");
for (const t of tools.tools) {
  console.log(`  ${t.name}: ${t.description?.slice(0, 60)}...`);
}

console.log("\n=== call get_slots(2026-05-25) ===");
const slotsResult = await client.callTool({
  name: "get_slots",
  arguments: { date: "2026-05-25" },
});
console.log(slotsResult.content);

console.log("\n=== call search_knowledge('politique annulation') ===");
const kbResult = await client.callTool({
  name: "search_knowledge",
  arguments: { query: "politique annulation" },
});
console.log(kbResult.content);

await client.close();
console.log("\nMCP probe OK.");
