import { NextResponse } from 'next/server'
import { db, reports, users, eq } from '@playroom/db'
import { adminReportActionSchema } from '@playroom/config'
import { getAdminContext } from '@/lib/admin'
import { notifyAllAdminsByEmail } from '@/lib/admin-alerts'
import { z } from 'zod'
import { applyRateLimit } from '@/lib/rate-limit-middleware'

const idSchema = z.coerce.number().int().positive()

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const admin = await getAdminContext()
  if (!admin.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (!admin.appUserId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const rateLimit = await applyRateLimit(admin.appUserId, 'ADMIN_ACTIONS')
  if (!rateLimit.allowed) {
    return rateLimit.response ?? NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
  }

  try {
    let body: unknown
    try {
      body = await _req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const parsedAction = adminReportActionSchema.safeParse(body)
    if (!parsedAction.success) {
      return NextResponse.json({ error: parsedAction.error.flatten() }, { status: 400 })
    }

    if (parsedAction.data.action !== 'ban') {
      return NextResponse.json({ error: 'Invalid report action for this endpoint' }, { status: 400 })
    }

    const parsedId = idSchema.safeParse(params.id)
    if (!parsedId.success) {
      return NextResponse.json({ error: 'Invalid report id' }, { status: 400 })
    }

    const reportId = parsedId.data
    const report = await db.query.reports.findFirst({
      where: eq(reports.id, reportId),
    })
    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    if (report.targetType !== 'user') {
      return NextResponse.json({ error: 'Ban action is only supported for user reports' }, { status: 400 })
    }

    const now = new Date().toISOString()

    const targetUser = await db.query.users.findFirst({
      where: eq(users.id, report.targetId),
    })
    if (!targetUser) {
      return NextResponse.json({ error: 'Target user not found' }, { status: 404 })
    }

    await db
      .update(users)
      .set({ deletedAt: now, updatedAt: now })
      .where(eq(users.id, report.targetId))

    await db
      .update(reports)
      .set({ status: 'resolved' })
      .where(eq(reports.id, reportId))

    await notifyAllAdminsByEmail({
      subject: '[The Playroom] Denúncia com banimento executado',
      text: `A denúncia #${reportId} resultou em banimento do utilizador #${report.targetId}, executado por admin #${admin.appUserId}.`,
    })

    return NextResponse.json({ ok: true, bannedUserId: report.targetId, reportId, status: 'resolved' })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
