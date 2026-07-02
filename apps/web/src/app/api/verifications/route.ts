import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { db, verifications, users } from '@playroom/db'
import { eq, sql } from 'drizzle-orm'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userResult = await (db as any).execute(sql`select id from users where clerk_user_id = ${userId} limit 1`)
  const user = userResult?.[0] as { id?: number } | undefined
  if (!user?.id) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const rows = await (db as any).execute(sql`select id, user_id as "userId", type, status, reviewed_by as "reviewedBy", evidence_ref as "evidenceRef", reviewed_at as "reviewedAt", created_at as "createdAt" from verifications where user_id = ${user.id} order by created_at desc`)

  return NextResponse.json(rows)
}

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userResult = await (db as any).execute(sql`select id from users where clerk_user_id = ${userId} limit 1`)
  const user = userResult?.[0] as { id?: number } | undefined
  if (!user?.id) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const { type, evidenceRef } = await req.json() as {
    type: 'photo' | 'video' | 'social'
    evidenceRef?: string
  }

  if (!['photo', 'video', 'social'].includes(type)) {
    return NextResponse.json({ error: 'Invalid verification type' }, { status: 400 })
  }

  const existingRows = await (db as any).execute(sql`select id, status from verifications where user_id = ${user.id} order by created_at desc limit 10`)
  const existing = existingRows?.[0] as { status?: string } | undefined
  if (existing?.status === 'approved') {
    return NextResponse.json({ error: 'Already verified' }, { status: 409 })
  }

  const [verification] = await (db as any).execute(sql`
    insert into verifications (user_id, type, status, evidence_ref, created_at)
    values (${user.id}, ${type}, 'pending', ${evidenceRef ?? null}, now())
    returning id, user_id as "userId", type, status, reviewed_by as "reviewedBy", evidence_ref as "evidenceRef", reviewed_at as "reviewedAt", created_at as "createdAt"
  `)

  return NextResponse.json(verification)
}
