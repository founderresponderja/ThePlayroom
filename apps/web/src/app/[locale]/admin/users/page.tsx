import { redirect } from 'next/navigation'
import { db } from '@playroom/db'
import { sql } from 'drizzle-orm'
import { getAdminContext } from '@/lib/admin'
import UsersAdminTable from './UsersAdminTable'

export const dynamic = 'force-dynamic'

export default async function AdminUsersPage({ params }: { params: { locale: string } }) {
  const adminContext = await getAdminContext()
  if (!adminContext.isAdmin) redirect(`/${params.locale}/dashboard`)

  const rows = await (db as any).execute(sql`
    select
      id,
      clerk_user_id as "clerkUserId",
      display_name as "displayName",
      account_type as "accountType",
      admin_role as "adminRole",
      verification_level as "verificationLevel",
      onboarding_complete as "onboardingComplete",
      is_vip as "isVip",
      created_at as "createdAt",
      deleted_at as "deletedAt"
    from users
    order by created_at desc
    limit 200
  `)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '1.5rem' }}>
      <h1 style={{ color: 'var(--text)', fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>👥 Utilizadores</h1>
      <UsersAdminTable
        initialUsers={rows}
        canManageRoles={adminContext.isSuperAdmin}
        currentAdminRole={adminContext.adminRole}
      />
    </div>
  )
}
