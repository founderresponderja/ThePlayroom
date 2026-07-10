import { NextResponse } from 'next/server'
import { db, users, eq, sql } from '@playroom/db'
import { getAdminContext } from '@/lib/admin'
import { notifyAllAdminsByEmail } from '@/lib/admin-alerts'

type UpdatePayload =
  | { action?: 'suspend'; deletedAt?: string }
  | { action: 'setRole'; adminRole: 'none' | 'admin' | 'super_admin' }

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const adminContext = await getAdminContext()
  if (!adminContext.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const body = (await req.json()) as UpdatePayload
    const userId = Number(params.id)
    if (!Number.isFinite(userId) || userId <= 0) {
      return NextResponse.json({ error: 'Invalid user id' }, { status: 400 })
    }

    if (body?.action === 'setRole') {
      if (!adminContext.isSuperAdmin) {
        return NextResponse.json({ error: 'Only super admin can change privileges' }, { status: 403 })
      }

      const targetUser = await db.query.users.findFirst({ where: eq(users.id, userId) })
      if (!targetUser) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }

      if (!['none', 'admin', 'super_admin'].includes(body.adminRole)) {
        return NextResponse.json({ error: 'Invalid admin role' }, { status: 400 })
      }

      if (targetUser.id === adminContext.appUserId && targetUser.adminRole === 'super_admin' && body.adminRole !== 'super_admin') {
        const superAdminCountRows = await (db as any).execute(sql`
          select count(*)::int as count
          from users
          where admin_role = 'super_admin'
            and deleted_at is null
        `)
        const superAdminCount = Number(superAdminCountRows?.[0]?.count ?? 0)

        if (superAdminCount <= 1) {
          return NextResponse.json({ error: 'Cannot remove the last super admin' }, { status: 400 })
        }
      }

      await db
        .update(users)
        .set({ adminRole: body.adminRole, updatedAt: new Date().toISOString() })
        .where(eq(users.id, userId))

      await notifyAllAdminsByEmail({
        subject: '[The Playroom] Privilégios de administração alterados',
        text: `O utilizador #${userId} (${targetUser.displayName}) passou para o papel ${body.adminRole}. Alteração feita por admin #${adminContext.appUserId}.`,
      })

      return NextResponse.json({ ok: true, adminRole: body.adminRole })
    }

    const deletedAt = body?.deletedAt ?? new Date().toISOString()

    const targetUser = await db.query.users.findFirst({ where: eq(users.id, userId) })
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    await (db as any).execute(sql`update users set deleted_at = ${deletedAt}, updated_at = ${new Date().toISOString()} where id = ${userId}`)

    await notifyAllAdminsByEmail({
      subject: '[The Playroom] Utilizador suspenso por admin',
      text: `O utilizador #${userId} (${targetUser.displayName}) foi suspenso por admin #${adminContext.appUserId}.`,
    })

    return NextResponse.json({ ok: true, deletedAt })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
