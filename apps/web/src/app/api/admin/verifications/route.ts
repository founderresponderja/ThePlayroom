import { NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin'
import { db } from '@playroom/db'
import { sql } from 'drizzle-orm'
import { applyRateLimit } from '@/lib/rate-limit-middleware'

type PendingVerificationRow = {
  id: number
  userId: number | null
  type: string
  status: string
  evidenceRef: string | null
  createdAt: string | null
  displayName: string | null
  accountType: string | null
}

export async function GET() {
  const admin = await getAdminContext()
  if (!admin.isAdmin || !admin.appUserId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const rateLimit = await applyRateLimit(admin.appUserId, 'ADMIN_ACTIONS')
  if (!rateLimit.allowed) {
    return rateLimit.response ?? NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
  }

  const rows = (await (db as any).execute(sql`
    select v.id, v.user_id as "userId", v.type, v.status, v.evidence_ref as "evidenceRef", v.created_at as "createdAt",
           u.display_name as "displayName", u.account_type as "accountType"
    from verifications v
    left join users u on u.id = v.user_id
    where v.status = 'pending'
    order by v.created_at asc
    limit 50
  `)) as PendingVerificationRow[]

  const pending = rows.map((row) => ({
    id: row.id,
    type: row.type,
    status: row.status,
    evidenceRef: row.evidenceRef,
    createdAt: row.createdAt,
    user: {
      id: row.userId,
      displayName: row.displayName,
      accountType: row.accountType,
    },
  }))

  return NextResponse.json(pending)
}
