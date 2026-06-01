// src/mcp/server.ts — Expose RDV-Pro's read-only tools over MCP.
//
// MCP (Model Context Protocol) is a standard JSON-RPC protocol
// for connecting LLM clients (Claude Desktop, Cursor, ChatGPT,
// custom apps) to external tools and data sources. Once this
// server is running, ANY MCP-aware client can use RDV-Pro's
// availability and knowledge base as if those tools were native.
//
// Read-only by design: we do NOT expose bookSlot or
// cancelBooking via MCP. Writes belong to RDV-Pro's authenticated
// HTTP API; exposing them to any client that can spawn a process
// would be a security mistake.
//
// Transport: stdio. The server reads JSON-RPC messages from
// stdin and writes responses to stdout. That's how
// Claude Desktop and Cursor launch local MCP servers — they
// spawn the process and talk to it over the standard streams.
//
// Run it as a child process of a client, or test it locally with:
//   npm run mcp:server
//   npx @modelcontextprotocol/inspector npx tsx src/mcp/server.ts

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { findFreeSlots } from "../agents/logic/find-slots";
import {
  findRelevantChunks,
} from "../agents/logic/find-knowledge";

const server = new McpServer({
  name: "rdv-pro",
  version: "0.10.0",
});

server.registerTool(
  "get_slots",
  {
    description:
      "List free appointment slots for a given date " +
      "(YYYY-MM-DD). Returns an array of { date, time }.",
    inputSchema: {
      date: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .describe("Date to look up, YYYY-MM-DD."),
    },
  },
  async ({ date }) => {
    const slots = await findFreeSlots(date);
    return {
      content: [
        { type: "text", text: JSON.stringify(slots, null, 2) },
      ],
    };
  },
);

server.registerTool(
  "search_knowledge",
  {
    description:
      "Search the salon's knowledge base (services, prices, " +
      "policies, FAQ). Returns the top-3 most relevant passages " +
      "with a similarity score.",
    inputSchema: {
      query: z
        .string()
        .min(3)
        .describe("Search query as a short phrase or keywords."),
    },
  },
  async ({ query }) => {
    const chunks = await findRelevantChunks(query);
    return {
      content: [
        { type: "text", text: JSON.stringify(chunks, null, 2) },
      ],
    };
  },
);

// All log output MUST go to stderr — stdout is reserved for the
// JSON-RPC stream. A stray console.log would corrupt the wire.
console.error("[mcp] rdv-pro server ready on stdio");

const transport = new StdioServerTransport();
await server.connect(transport);
