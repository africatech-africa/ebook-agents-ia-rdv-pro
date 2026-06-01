// src/lib/cost.ts — Per-turn cost estimation.
//
// Gemini pricing as of late 2025 (USD per 1M tokens, AI Studio
// paid tier). Always refresh from the official pricing page in
// production — Google updates these regularly and you want your
// alerts to match reality. The free tier returns 0 here.
//
// Helpers:
//   - PRICING: lookup table
//   - estimateCost(model, inputTokens, outputTokens)
//   - formatCostUSD(amount) → "$0.000123"

export type ModelId =
  | "gemini-2.5-flash"
  | "gemini-2.5-pro"
  | "gemini-embedding-001";

export type ModelPricing = {
  // USD per 1 000 000 input tokens.
  inputPerMillion: number;
  // USD per 1 000 000 output tokens (incl. reasoning tokens
  // for Gemini 2.5).
  outputPerMillion: number;
};

export const PRICING: Record<ModelId, ModelPricing> = {
  "gemini-2.5-flash": {
    inputPerMillion: 0.3,
    outputPerMillion: 2.5,
  },
  "gemini-2.5-pro": {
    inputPerMillion: 1.25,
    outputPerMillion: 10.0,
  },
  "gemini-embedding-001": {
    inputPerMillion: 0.15,
    outputPerMillion: 0,
  },
};

export function estimateCost(
  model: ModelId,
  inputTokens: number,
  outputTokens: number,
): number {
  const price = PRICING[model];
  return (
    (inputTokens * price.inputPerMillion) / 1_000_000 +
    (outputTokens * price.outputPerMillion) / 1_000_000
  );
}

export function formatCostUSD(amount: number): string {
  // 6 decimals because a single turn often costs less than a
  // millicent. Truncate trailing zeros for readability.
  return `$${amount.toFixed(6).replace(/0+$/, "").replace(/\.$/, "")}`;
}
