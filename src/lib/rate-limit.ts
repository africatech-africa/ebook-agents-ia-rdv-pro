// src/lib/rate-limit.ts — Fixed-window per-IP rate limiter.
//
// Token-bucket flavour: each (ip, window) starts with a budget,
// every request decrements. When it hits 0, the route returns
// 429 until the next window.
//
// In-memory is fine for a single-instance demo; in production,
// swap the `Map` for Redis / Upstash so multiple instances share
// the same counter. The Hono middleware shape stays the same.

import type { MiddlewareHandler } from "hono";

type Bucket = { tokens: number; resetAt: number };

const buckets = new Map<string, Bucket>();

function clientIp(c: Parameters<MiddlewareHandler>[0]): string {
  // Trust the proxy header in dev. In real prod, lock this down
  // to the IP your load balancer / CDN sets, and refuse the rest.
  return (
    c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ??
    c.req.header("x-real-ip") ??
    "unknown"
  );
}

export type RateLimitOptions = {
  windowMs: number; // window size in milliseconds
  max: number; // max requests per window per IP
};

export function rateLimit(
  opts: RateLimitOptions,
): MiddlewareHandler {
  return async (c, next) => {
    const ip = clientIp(c);
    const now = Date.now();
    let bucket = buckets.get(ip);

    if (bucket === undefined || bucket.resetAt < now) {
      bucket = { tokens: opts.max, resetAt: now + opts.windowMs };
      buckets.set(ip, bucket);
    }

    if (bucket.tokens <= 0) {
      const retryIn = Math.ceil((bucket.resetAt - now) / 1000);
      c.header("Retry-After", String(retryIn));
      return c.json(
        { error: `Rate limit exceeded. Retry in ${retryIn}s.` },
        429,
      );
    }

    bucket.tokens -= 1;
    await next();
  };
}
