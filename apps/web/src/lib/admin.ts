import { auth, clerkClient } from '@clerk/nextjs/server'
import { db, users, eq } from '@playroom/db'
import { ensureCurrentUserByClerkId } from '@/lib/current-user'

export type AdminRole = 'none' | 'admin' | 'super_admin'

const DEFAULT_SUPER_ADMIN_EMAIL = 'ampliasolutions@gmail.com'

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
  const target = (process.env.SUPER_ADMIN_EMAIL ?? DEFAULT_SUPER_ADMIN_EMAIL).trim().toLowerCase()
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

  const email = await getPrimaryEmail(context.userId)
  if (!isBootstrapSuperAdminEmail(email)) return context

  await db
    .update(users)
    .set({ adminRole: 'super_admin', updatedAt: new Date().toISOString() })
    .where(eq(users.id, context.appUserId))

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
