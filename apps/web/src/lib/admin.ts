import { auth, clerkClient } from '@clerk/nextjs/server'
import { db, users, eq } from '@playroom/db'
import { ensureCurrentUserByClerkId } from '@/lib/current-user'

export type AdminRole = 'none' | 'admin' | 'super_admin'

type AdminContext = {
  userId: string | null
  appUserId: number | null
  adminRole: AdminRole
  isAdmin: boolean
  isSuperAdmin: boolean
}

function normalizeRole(role?: string | null): AdminRole {
  if (role === 'super_admin' || role === 'admin') return role
  return 'none'
}

function isBootstrapSuperAdminEmail(email?: string | null) {
  // SECURITY: Require explicit env var to enable bootstrap super admin
  // Do NOT auto-promote users without explicit configuration
  const target = process.env.SUPER_ADMIN_EMAIL?.trim().toLowerCase()
  if (!target) {
    if (process.env.NODE_ENV === 'production') {
      console.warn('[admin] SUPER_ADMIN_EMAIL not configured - bootstrap super admin disabled')
    }
    return false
  }
  return Boolean(email && email.trim().toLowerCase() === target)
}

async function getPrimaryEmail(userId: string) {
  try {
    const user = await clerkClient.users.getUser(userId)
    const primary = user.emailAddresses.find((entry) => entry.id === user.primaryEmailAddressId)
    return primary?.emailAddress ?? user.emailAddresses[0]?.emailAddress ?? null
  } catch (error) {
    console.error('[admin] failed to fetch Clerk email', { userId, error })
    return null
  }
}

async function maybeBootstrapSuperAdmin(context: AdminContext): Promise<AdminContext> {
  if (!context.userId || !context.appUserId) return context
  if (context.adminRole === 'super_admin') return context

  // Only proceed if bootstrap is enabled via env var
  if (!process.env.SUPER_ADMIN_EMAIL?.trim()) {
    return context
  }

  const email = await getPrimaryEmail(context.userId)
  if (!isBootstrapSuperAdminEmail(email)) return context

  console.warn('[admin] Bootstrap promoting user to super_admin', { userId: context.userId, email })

  try {
    await db
      .update(users)
      .set({ adminRole: 'super_admin', updatedAt: new Date().toISOString() })
      .where(eq(users.id, context.appUserId))
  } catch (error) {
    console.error('[admin] Failed to bootstrap super admin', { error })
    return context
  }

  return {
    ...context,
    adminRole: 'super_admin',
    isAdmin: true,
    isSuperAdmin: true,
  }
}

export async function getAdminContext(): Promise<AdminContext> {
  const { userId } = await auth()
  if (!userId) {
    return {
      userId: null,
      appUserId: null,
      adminRole: 'none',
      isAdmin: false,
      isSuperAdmin: false,
    }
  }

  const appUser = await ensureCurrentUserByClerkId(userId)
  if (!appUser) {
    return {
      userId,
      appUserId: null,
      adminRole: 'none',
      isAdmin: false,
      isSuperAdmin: false,
    }
  }

  const role = normalizeRole(appUser.adminRole)
  const baseContext: AdminContext = {
    userId,
    appUserId: appUser.id,
    adminRole: role,
    isAdmin: role === 'admin' || role === 'super_admin',
    isSuperAdmin: role === 'super_admin',
  }

  return maybeBootstrapSuperAdmin(baseContext)
}

export async function isAdmin(): Promise<boolean> {
  const context = await getAdminContext()
  return context.isAdmin
}

export async function isSuperAdmin(): Promise<boolean> {
  const context = await getAdminContext()
  return context.isSuperAdmin
}
