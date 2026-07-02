import { NextResponse } from 'next/server'
import { db } from '@playroom/db'
import { sql } from 'drizzle-orm'
import { isAdmin } from '@/lib/admin'

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const admin = await isAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const reportId = Number(params.id)
    const reportResult = await (db as any).execute(sql`select target_id as "targetId" from reports where id = ${reportId} limit 1`)
    const targetId = reportResult?.[0]?.targetId

    if (targetId) {
      await (db as any).execute(sql`update users set deleted_at = ${new Date().toISOString()} where id = ${targetId}`)
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
