/**
 * Rate Limiting Middleware
 * Provides standardized rate limiting responses and header generation
 */

import { NextResponse, type NextRequest } from 'next/server'
import { checkRateLimit, getRateLimitStatus, RATE_LIMITS } from './rate-limiter'

export type RateLimitKey = 'MESSAGES' | 'MATCHES' | 'PHOTO_UPLOAD' | 'ORDERS_CREATE' | 'ADMIN_ACTIONS'
  | 'PHOTO_DELETE'
  | 'CHECKOUT'

/**
 * Apply rate limit to a request and return response if exceeded
 * @returns null if within limit, NextResponse if exceeded
 */
export function applyRateLimit(
  userId: string | number,
  limitKey: RateLimitKey
): {
  allowed: boolean
  remaining: number
  resetTime: number
  response?: NextResponse
} {
  const config = RATE_LIMITS[limitKey]
  const key = `${limitKey}:${userId}`

  const allowed = checkRateLimit(key, config.requests, config.windowMs)
  const status = getRateLimitStatus(key, config.requests, config.windowMs)

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
