import { NextResponse } from 'next/server'
import { isAdmin } from '@/lib/admin'
import { db } from '@playroom/db'
import { sql } from 'drizzle-orm'

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
  const admin = await isAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

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
