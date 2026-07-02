import { NextResponse } from 'next/server'
import { db } from '@playroom/db'
import { sql } from 'drizzle-orm'
import { isAdmin } from '@/lib/admin'

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const admin = await isAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const reportId = Number(params.id)
    await (db as any).execute(sql`update reports set status = 'resolved' where id = ${reportId}`)
    return NextResponse.json({ ok: true, status: 'resolved' })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
