import { NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin'
import { db } from '@playroom/db'
import { sql } from 'drizzle-orm'
import { z } from 'zod'
import { applyRateLimit } from '@/lib/rate-limit-middleware'

const patchVerificationSchema = z.object({
  status: z.enum(['approved', 'rejected']),
})

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const admin = await getAdminContext()
  if (!admin.isAdmin || !admin.appUserId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const rateLimit = applyRateLimit(admin.appUserId, 'ADMIN_ACTIONS')
  if (!rateLimit.allowed) {
    return rateLimit.response ?? NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
  }

  const verificationId = Number(params.id)
  if (!Number.isInteger(verificationId) || verificationId <= 0) {
    return NextResponse.json({ error: 'Invalid verification id' }, { status: 400 })
  }

  const parsed = patchVerificationSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const { status } = parsed.data

  const existing = await (db as any).execute(sql`
    select id, user_id as "userId", type
    from verifications
    where id = ${verificationId}
    limit 1
  `)

  const current = existing?.[0] as { id: number; userId?: number | null; type?: string } | undefined
  if (!current) return NextResponse.json({ error: 'Verification not found' }, { status: 404 })

  const [updated] = await (db as any).execute(sql`
    update verifications
    set status = ${status}, reviewed_at = now()
    where id = ${verificationId}
    returning id, user_id as "userId", type, status, reviewed_by as "reviewedBy", evidence_ref as "evidenceRef", reviewed_at as "reviewedAt", created_at as "createdAt"
  `)

  if (status === 'approved' && updated) {
    const levelMap: Record<string, 'photo' | 'video' | 'social'> = {
      photo: 'photo',
      video: 'video',
      social: 'social',
    }
    const newLevel = levelMap[current.type ?? '']

    if (current.userId && newLevel) {
      await (db as any).execute(sql`
        update users
        set verification_level = ${newLevel}, updated_at = now()
        where id = ${current.userId}
      `)
    }
  }

  return NextResponse.json(updated)
}
