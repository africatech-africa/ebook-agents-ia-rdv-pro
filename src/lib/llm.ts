// src/lib/llm.ts — Vercel AI SDK provider wrapper.
//
// Loads .env, then exposes the Google Generative AI provider with a
// stable configuration. Every script in the project should import
// the `google` object from here rather than from the SDK directly,
// so changing the base URL or the model defaults happens in one
// place.

import "dotenv/config";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

// Pin the base URL to the official Google AI Studio endpoint.
// The SDK reads GOOGLE_GENERATIVE_AI_API_KEY from the environment.
// Pinning the URL here protects us from a stray env var pointing the
// client at a proxy or a different Google product (e.g. Vertex AI).
export const google = createGoogleGenerativeAI({
  baseURL: "https://generativelanguage.googleapis.com/v1beta",
});

// Default model picks for the book.
// - FLASH: fast and cheap, 1M-token context. Default for most tasks.
// - PRO:   smarter, slower, pricier. Use it when the task needs
//          real reasoning (long analyses, tricky tool chains).
export const FLASH = "gemini-2.5-flash";
export const PRO = "gemini-2.5-pro";
