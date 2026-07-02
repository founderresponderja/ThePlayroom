import { NextResponse } from 'next/server'
import { isAdmin } from '@/lib/admin'
import { db } from '@playroom/db'
import { sql } from 'drizzle-orm'

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const admin = await isAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { status } = await req.json() as { status: 'approved' | 'rejected' }

  if (!['approved', 'rejected'].includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const verificationId = Number(params.id)
  const [updated] = await (db as any).execute(sql`
    update verifications
    set status = ${status}, reviewed_at = now()
    where id = ${verificationId}
    returning id, user_id as "userId", type, status, reviewed_by as "reviewedBy", evidence_ref as "evidenceRef", reviewed_at as "reviewedAt", created_at as "createdAt"
  `)

  if (status === 'approved' && updated) {
    const verification = await (db as any).execute(sql`select type, user_id as "userId" from verifications where id = ${verificationId} limit 1`)
    const row = verification?.[0] as { type?: string; userId?: number } | undefined
    if (row?.userId) {
      const levelMap: Record<string, string> = {
        photo: 'photo',
        video: 'video',
        social: 'social',
      }
      await (db as any).execute(sql`
        update users
        set verification_level = ${levelMap[row.type ?? ''] ?? 'none'}, updated_at = now()
        where id = ${row.userId}
      `)
    }
  }

  return NextResponse.json(updated)
}
