import { NextResponse } from 'next/server'
import { isAdmin } from '@/lib/admin'
import { db, users } from '@playroom/db'
import { sql } from 'drizzle-orm'

export async function GET() {
  const admin = await isAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const pending = await (db as any).execute(sql`
    select v.id, v.user_id as "userId", v.type, v.status, v.evidence_ref as "evidenceRef", v.created_at as "createdAt",
           u.id as "userIdRef", u.display_name as "displayName", u.account_type as "accountType"
    from verifications v
    left join users u on u.id = v.user_id
    where v.status = 'pending'
    order by v.created_at asc
    limit 50
  `)

  return NextResponse.json(pending)
}
