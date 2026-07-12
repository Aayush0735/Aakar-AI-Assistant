/**
 * Rate Limiter — Upstash Redis-based rate limiting
 *
 * Limits each IP address to 20 messages per 24-hour sliding window.
 * Falls back to an in-memory store if Redis is not configured (dev mode).
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// In-memory fallback for development without Redis configured
const inMemoryStore = new Map<string, { count: number; resetAt: number }>();

const RATE_LIMIT = 20;
const WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Check if Upstash Redis is configured
 */
function isRedisConfigured(): boolean {
  return !!(
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN
  );
}

/**
 * Create the Upstash rate limiter (lazy singleton)
 */
let _ratelimit: Ratelimit | null = null;

function getUpstashRatelimit(): Ratelimit {
  if (!_ratelimit) {
    _ratelimit = new Ratelimit({
      redis: new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL!,
        token: process.env.UPSTASH_REDIS_REST_TOKEN!,
      }),
      limiter: Ratelimit.slidingWindow(RATE_LIMIT, "24 h"),
      prefix: "chat-agent-rl",
    });
  }
  return _ratelimit;
}

/**
 * In-memory rate limiter for development
 */
function checkInMemoryLimit(identifier: string): {
  success: boolean;
  remaining: number;
} {
  const now = Date.now();
  const entry = inMemoryStore.get(identifier);

  if (!entry || now > entry.resetAt) {
    inMemoryStore.set(identifier, { count: 1, resetAt: now + WINDOW_MS });
    return { success: true, remaining: RATE_LIMIT - 1 };
  }

  if (entry.count >= RATE_LIMIT) {
    return { success: false, remaining: 0 };
  }

  entry.count++;
  return { success: true, remaining: RATE_LIMIT - entry.count };
}

/**
 * Check rate limit for a given identifier (typically IP address)
 */
export async function checkRateLimit(identifier: string): Promise<{
  success: boolean;
  remaining: number;
}> {
  if (isRedisConfigured()) {
    const result = await getUpstashRatelimit().limit(identifier);
    return { success: result.success, remaining: result.remaining };
  }

  // Fallback to in-memory for development
  console.warn(
    "[Rate Limiter] Upstash Redis not configured — using in-memory fallback"
  );
  return checkInMemoryLimit(identifier);
}

/**
 * Rate limit exceeded message
 */
export const RATE_LIMIT_MESSAGE =
  "You've reached your daily message limit (20 messages per day). " +
  "Please try again tomorrow, or call our front desk at +91 98765 43210 for immediate assistance!";
