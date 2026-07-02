import { NextResponse } from 'next/server'
import { db } from '@playroom/db'
import { sql } from 'drizzle-orm'
import { isAdmin } from '@/lib/admin'

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const admin = await isAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const body = await req.json()
    const userId = Number(params.id)
    const deletedAt = body?.deletedAt ?? new Date().toISOString()

    await (db as any).execute(sql`update users set deleted_at = ${deletedAt} where id = ${userId}`)
    return NextResponse.json({ ok: true, deletedAt })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
