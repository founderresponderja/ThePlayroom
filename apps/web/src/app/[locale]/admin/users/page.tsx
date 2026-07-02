import { redirect } from 'next/navigation'
import { db } from '@playroom/db'
import { sql } from 'drizzle-orm'
import { isAdmin } from '@/lib/admin'
import UsersAdminTable from './UsersAdminTable'

export const dynamic = 'force-dynamic'

export default async function AdminUsersPage({ params }: { params: { locale: string } }) {
  const admin = await isAdmin()
  if (!admin) redirect(`/${params.locale}/dashboard`)

  const rows = await (db as any).execute(sql`select id, clerk_user_id as "clerkUserId", display_name as "displayName", account_type as "accountType", verification_level as "verificationLevel", onboarding_complete as "onboardingComplete", is_vip as "isVip", created_at as "createdAt", deleted_at as "deletedAt" from users order by created_at desc limit 100`)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '1.5rem' }}>
      <h1 style={{ color: 'var(--text)', fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>👥 Utilizadores</h1>
      <UsersAdminTable initialUsers={rows} />
    </div>
  )
}
