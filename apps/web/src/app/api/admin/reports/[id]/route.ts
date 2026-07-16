import { NextResponse } from 'next/server'
import { db, reports, eq } from '@playroom/db'
import { getAdminContext } from '@/lib/admin'
import { notifyAllAdminsByEmail } from '@/lib/admin-alerts'
import { z } from 'zod'
import { applyRateLimit } from '@/lib/rate-limit-middleware'

const idSchema = z.coerce.number().int().positive()

export async function PATCH(_req: Request, { params }: { params: { id: string } }) {
  const admin = await getAdminContext()
  if (!admin.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (!admin.appUserId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const rateLimit = applyRateLimit(admin.appUserId, 'ADMIN_ACTIONS')
  if (!rateLimit.allowed) {
    return rateLimit.response ?? NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
  }

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

    await notifyAllAdminsByEmail({
      subject: '[The Playroom] Denúncia resolvida por admin',
      text: `A denúncia #${reportId} foi marcada como resolvida pelo admin #${admin.appUserId}.`,
    })

    return NextResponse.json({ ok: true, status: 'resolved', reportId })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
