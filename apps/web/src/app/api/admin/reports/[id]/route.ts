import { NextResponse } from 'next/server'
import { db, reports, eq } from '@playroom/db'
import { isAdmin } from '@/lib/admin'
import { z } from 'zod'

const idSchema = z.coerce.number().int().positive()

export async function PATCH(_req: Request, { params }: { params: { id: string } }) {
  const admin = await isAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const parsedId = idSchema.safeParse(params.id)
    if (!parsedId.success) {
      return NextResponse.json({ error: 'Invalid report id' }, { status: 400 })
    }

    const reportId = parsedId.data
    const existing = await db.query.reports.findFirst({
      where: eq(reports.id, reportId),
    })
    if (!existing) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    await db
      .update(reports)
      .set({ status: 'resolved' })
      .where(eq(reports.id, reportId))

    return NextResponse.json({ ok: true, status: 'resolved', reportId })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
