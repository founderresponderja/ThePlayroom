/**
 * IN USE IN REAL API ROUTES: This in-memory limiter is now actively enforcing
 * limits on critical endpoints.
 *
 * WARNING: This remains insufficient for multi-instance or multi-region
 * deployments because counters are local to each process.
 *
 * Simple in-memory rate limiter using sliding window algorithm.
 * For production, integrate with Redis via Upstash.
 *
 * CRITICAL: This is a temporary solution. Production should use Upstash Redis
 * to avoid distributed system issues (each server instance has its own memory).
 */

interface RateLimitEntry {
  count: number
  resetTime: number
}

const limits = new Map<string, RateLimitEntry>()

/**
 * Clean up old entries every 5 minutes
 */
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of limits.entries()) {
    if (entry.resetTime < now) {
      limits.delete(key)
    }
  }
}, 5 * 60 * 1000)

/**
 * Check if a request exceeds rate limit
 * @param key - Unique identifier (e.g., userId, IP address)
 * @param maxRequests - Maximum requests allowed
 * @param windowMs - Time window in milliseconds
 * @returns true if within limit, false if exceeded
 */
export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): boolean {
  const now = Date.now()
  const entry = limits.get(key)

  // If entry doesn't exist or time window has passed, reset counter
  if (!entry || entry.resetTime < now) {
    limits.set(key, {
      count: 1,
      resetTime: now + windowMs,
    })
    return true
  }

  // Increment counter
  entry.count++

  // Check if limit exceeded
  if (entry.count > maxRequests) {
    return false
  }

  return true
}

/**
 * Get current rate limit status
 */
export function getRateLimitStatus(
  key: string,
  maxRequests: number,
  windowMs: number
): {
  remaining: number
  resetTime: number
  limited: boolean
} {
  const now = Date.now()
  const entry = limits.get(key)

  if (!entry || entry.resetTime < now) {
    return {
      remaining: maxRequests,
      resetTime: now + windowMs,
      limited: false,
    }
  }

  return {
    remaining: Math.max(0, maxRequests - entry.count),
    resetTime: entry.resetTime,
    limited: entry.count >= maxRequests,
  }
}

/**
 * IMPORTANT: Rate limiting configuration for critical endpoints
 * Values based on business logic and capacity planning
 *
 * These should be tuned based on load testing results.
 */
export const RATE_LIMITS = {
  // Authentication
  SIGN_IN: { requests: 5, windowMs: 15 * 60 * 1000 }, // 5 attempts per 15 minutes
  SIGN_UP: { requests: 3, windowMs: 60 * 60 * 1000 }, // 3 per hour
  PASSWORD_RESET: { requests: 3, windowMs: 60 * 60 * 1000 },

  // Messaging & Social
  MESSAGES: { requests: 50, windowMs: 60 * 1000 }, // 50 per minute
  MATCHES: { requests: 10, windowMs: 60 * 60 * 1000 }, // 10 per hour (free users)

  // Photos & Media
  PHOTO_UPLOAD: { requests: 20, windowMs: 60 * 60 * 1000 }, // 20 per hour
  PHOTO_DELETE: { requests: 100, windowMs: 60 * 60 * 1000 }, // 100 per hour

  // Orders & Payments
  ORDERS_CREATE: { requests: 10, windowMs: 60 * 60 * 1000 }, // 10 per hour
  CHECKOUT: { requests: 5, windowMs: 60 * 60 * 1000 }, // 5 per hour

  // AI-heavy operations
  COUPLE_PROFILE_GENERATION: { requests: 5, windowMs: 24 * 60 * 60 * 1000 }, // 5 per day, per user

  // Admin Actions
  ADMIN_ACTIONS: { requests: 30, windowMs: 60 * 1000 }, // 30 per minute
}
