import { NextResponse } from 'next/server'
import { db, sql } from '@playroom/db'

export const dynamic = 'force-dynamic'

type RequiredEnvKey =
  | 'CLERK_SECRET_KEY'
  | 'STRIPE_SECRET_KEY'
  | 'MAKE_OPS_WEBHOOK_URL'
  | 'DIRECT_URL'

const requiredEnvKeys: RequiredEnvKey[] = [
  'CLERK_SECRET_KEY',
  'STRIPE_SECRET_KEY',
  'MAKE_OPS_WEBHOOK_URL',
  'DIRECT_URL',
]

function getEnvStatus() {
  return requiredEnvKeys.map((key) => ({
    key,
    configured: Boolean(process.env[key]),
  }))
}

export async function GET() {
  const env = getEnvStatus()
  const allEnvConfigured = env.every((item) => item.configured)

  let database = {
    configured: Boolean(process.env.DIRECT_URL),
    reachable: false,
    error: null as string | null,
  }

  try {
    await db.execute(sql`select 1`)
    database = {
      ...database,
      reachable: true,
      error: null,
    }
  } catch (error) {
    database = {
      ...database,
      reachable: false,
      error: error instanceof Error ? error.message : 'Unknown database error',
    }
  }

  const status = allEnvConfigured && database.reachable ? 'ok' : 'error'

  return NextResponse.json(
    {
      status,
      checkedAt: new Date().toISOString(),
      subsystems: {
        database,
        environment: env,
      },
    },
    {
      status: status === 'ok' ? 200 : 503,
      headers: { 'Cache-Control': 'no-store' },
    },
  )
}
