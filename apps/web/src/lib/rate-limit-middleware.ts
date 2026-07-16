/**
 * Rate Limiting Middleware
 * Provides standardized rate limiting responses and header generation
 */

import { NextResponse, type NextRequest } from 'next/server'
import { checkRateLimit, getRateLimitStatus, RATE_LIMITS } from './rate-limiter'
import { getLimiter, upstashAvailable } from './rate-limiter-upstash'

export type RateLimitKey = 'MESSAGES' | 'MATCHES' | 'PHOTO_UPLOAD' | 'ORDERS_CREATE' | 'ADMIN_ACTIONS'
  | 'PHOTO_DELETE'
  | 'CHECKOUT'
  | 'COUPLE_PROFILE_GENERATION'

/**
 * Apply rate limit to a request and return response if exceeded
 * @returns null if within limit, NextResponse if exceeded
 */
export async function applyRateLimit(
  userId: string | number,
  limitKey: RateLimitKey
): Promise<{
  allowed: boolean
  remaining: number
  resetTime: number
  response?: NextResponse
}> {
  const config = RATE_LIMITS[limitKey]
  const key = String(userId)

  if (upstashAvailable) {
    const limiter = getLimiter(limitKey, config.requests, Math.ceil(config.windowMs / 1000))

    if (limiter) {
      const result = await limiter.limit(key)
      if (!result.success) {
        const retryAfter = Math.max(1, Math.ceil((result.reset - Date.now()) / 1000))
        const response = NextResponse.json(
          {
            error: 'Rate limit exceeded',
            retryAfter,
          },
          { status: 429 }
        )

        response.headers.set('RateLimit-Limit', String(result.limit))
        response.headers.set('RateLimit-Remaining', String(result.remaining))
        response.headers.set('RateLimit-Reset', String(Math.ceil(result.reset / 1000)))
        response.headers.set('Retry-After', String(retryAfter))

        return {
          allowed: false,
          remaining: result.remaining,
          resetTime: result.reset,
          response,
        }
      }

      return {
        allowed: true,
        remaining: result.remaining,
        resetTime: result.reset,
      }
    }
  }

  const fallbackKey = `${limitKey}:${key}`

  const allowed = checkRateLimit(fallbackKey, config.requests, config.windowMs)
  const status = getRateLimitStatus(fallbackKey, config.requests, config.windowMs)

  if (!allowed) {
    const response = NextResponse.json(
      {
        error: 'Rate limit exceeded',
        retryAfter: Math.ceil((status.resetTime - Date.now()) / 1000),
      },
      { status: 429 }
    )

    response.headers.set('RateLimit-Limit', String(config.requests))
    response.headers.set('RateLimit-Remaining', '0')
    response.headers.set('RateLimit-Reset', String(Math.ceil(status.resetTime / 1000)))
    response.headers.set('Retry-After', String(Math.ceil((status.resetTime - Date.now()) / 1000)))

    return {
      allowed: false,
      remaining: 0,
      resetTime: status.resetTime,
      response,
    }
  }

  return {
    allowed: true,
    remaining: status.remaining,
    resetTime: status.resetTime,
  }
}

/**
 * Add rate limit headers to response
 */
export function addRateLimitHeaders(
  response: NextResponse,
  userId: string | number,
  limitKey: RateLimitKey
): NextResponse {
  const config = RATE_LIMITS[limitKey]
  const key = `${limitKey}:${userId}`
  const status = getRateLimitStatus(key, config.requests, config.windowMs)

  response.headers.set('RateLimit-Limit', String(config.requests))
  response.headers.set('RateLimit-Remaining', String(status.remaining))
  response.headers.set('RateLimit-Reset', String(Math.ceil(status.resetTime / 1000)))

  return response
}
