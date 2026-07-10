import { NextResponse } from 'next/server'
import { db, reports, users, eq } from '@playroom/db'
import { getAdminContext } from '@/lib/admin'
import { notifyAllAdminsByEmail } from '@/lib/admin-alerts'
import { z } from 'zod'

const idSchema = z.coerce.number().int().positive()

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const admin = await getAdminContext()
  if (!admin.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
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
