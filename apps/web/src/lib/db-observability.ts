type DbErrorMeta = {
  code: string | null
  message: string
  detail: string | null
  constraint: string | null
  table: string | null
}

type DbOpStats = {
  attempts: number
  successes: number
  failures: number
  retries: number
  lastErrorCode: string | null
  lastErrorAt: string | null
}

type RetryOptions = {
  maxAttempts?: number
  retryableCodes?: string[]
  baseDelayMs?: number
}

const DEFAULT_RETRYABLE_CODES = new Set([
  '40001', // serialization_failure
  '40P01', // deadlock_detected
  '53300', // too_many_connections
  '57P03', // cannot_connect_now
  '08000', // connection_exception
  '08001', // sqlclient_unable_to_establish_sqlconnection
  '08003', // connection_does_not_exist
  '08006', // connection_failure
])

const dbOpStats = new Map<string, DbOpStats>()

function ensureStat(op: string) {
  const existing = dbOpStats.get(op)
  if (existing) return existing

  const created: DbOpStats = {
    attempts: 0,
    successes: 0,
    failures: 0,
    retries: 0,
    lastErrorCode: null,
    lastErrorAt: null,
  }

  dbOpStats.set(op, created)
  return created
}

function getErrorMeta(error: unknown): DbErrorMeta {
  const candidate = error as {
    code?: unknown
    sqlState?: unknown
    message?: unknown
    detail?: unknown
    constraint?: unknown
    table?: unknown
  }

  const code =
    typeof candidate?.code === 'string'
      ? candidate.code
      : typeof candidate?.sqlState === 'string'
        ? candidate.sqlState
        : null

  const message = error instanceof Error ? error.message : String(error)

  return {
    code,
    message,
    detail: typeof candidate?.detail === 'string' ? candidate.detail : null,
    constraint: typeof candidate?.constraint === 'string' ? candidate.constraint : null,
    table: typeof candidate?.table === 'string' ? candidate.table : null,
  }
}

function isRetryableCode(code: string | null, retryableCodes?: string[]) {
  if (!code) return false
  if (retryableCodes && retryableCodes.length > 0) {
    return retryableCodes.includes(code)
  }
  return DEFAULT_RETRYABLE_CODES.has(code)
}

async function wait(ms: number) {
  if (ms <= 0) return
  await new Promise((resolve) => setTimeout(resolve, ms))
}

export async function withDbRetry<T>(operation: string, fn: () => Promise<T>, options: RetryOptions = {}) {
  const maxAttempts = Math.max(1, options.maxAttempts ?? 3)
  const baseDelayMs = Math.max(0, options.baseDelayMs ?? 50)
  const stat = ensureStat(operation)

  let lastError: unknown

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    stat.attempts += 1

    try {
      const result = await fn()
      stat.successes += 1
      return result
    } catch (error) {
      lastError = error
      const meta = getErrorMeta(error)

      stat.lastErrorCode = meta.code
      stat.lastErrorAt = new Date().toISOString()

      const canRetry = attempt < maxAttempts && isRetryableCode(meta.code, options.retryableCodes)
      if (canRetry) {
        stat.retries += 1

        console.warn('[db][retry]', {
          operation,
          attempt,
          maxAttempts,
          code: meta.code,
          message: meta.message,
        })

        await wait(baseDelayMs * attempt)
        continue
      }

      stat.failures += 1
      console.error('[db][error]', {
        operation,
        attempt,
        maxAttempts,
        code: meta.code,
        message: meta.message,
        detail: meta.detail,
        constraint: meta.constraint,
        table: meta.table,
      })

      throw error
    }
  }

  throw lastError
}

export function getDbObservabilitySnapshot() {
  return Object.fromEntries(dbOpStats.entries())
}
