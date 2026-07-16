import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null

export const upstashAvailable = redis !== null

console.log(`[rate-limiter-upstash] upstashAvailable: ${upstashAvailable}`)

const limiters = new Map<string, Ratelimit>()

export function getLimiter(key: string, requests: number, windowSeconds: number): Ratelimit | null {
  if (!redis) return null

  const cacheKey = `${key}:${requests}:${windowSeconds}`
  if (!limiters.has(cacheKey)) {
    limiters.set(
      cacheKey,
      new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(requests, `${windowSeconds} s`),
        prefix: `playroom:${key}`,
      })
    )
  }

  return limiters.get(cacheKey)!
}
