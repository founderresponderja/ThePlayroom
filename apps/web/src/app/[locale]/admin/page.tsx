import { redirect } from 'next/navigation'
import { db, users } from '@playroom/db'
import { eq, gte, sql } from 'drizzle-orm'
import { isAdmin } from '@/lib/admin'
import AdminDashboard from './AdminDashboard'

export const dynamic = 'force-dynamic'

export default async function AdminPage({ params }: { params: { locale: string } }) {
  const admin = await isAdmin()
  if (!admin) redirect(`/${params.locale}/dashboard`)

  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const totalUsersResult = await (db as any).execute(sql`select count(*)::int as count from users`)
  const totalUsers = Number(totalUsersResult?.[0]?.count ?? 0)

  const newUsersResult = await (db as any).execute(sql`select count(*)::int as count from users where created_at >= ${thirtyDaysAgo}`)
  const newUsers30d = Number(newUsersResult?.[0]?.count ?? 0)

  const vipUsersResult = await (db as any).execute(sql`select count(*)::int as count from users where is_vip = true`)
  const vipUsers = Number(vipUsersResult?.[0]?.count ?? 0)

  const totalMatchesResult = await (db as any).execute(sql`select count(*)::int as count from matches where status = 'matched'`)
  const totalMatches = Number(totalMatchesResult?.[0]?.count ?? 0)

  const totalMessagesResult = await (db as any).execute(sql`select count(*)::int as count from messages`)
  const totalMessages = Number(totalMessagesResult?.[0]?.count ?? 0)

  const totalEventsResult = await (db as any).execute(sql`select count(*)::int as count from events`)
  const totalEvents = Number(totalEventsResult?.[0]?.count ?? 0)

  const totalReservationsResult = await (db as any).execute(sql`select count(*)::int as count from reservations`)
  const totalReservations = Number(totalReservationsResult?.[0]?.count ?? 0)

  const activeSubsResult = await (db as any).execute(sql`select count(*)::int as count from subscriptions where status = 'active'`)
  const activeSubscriptions = Number(activeSubsResult?.[0]?.count ?? 0)

  const pendingReportsResult = await (db as any).execute(sql`select count(*)::int as count from reports where status in ('pending', 'open')`)
  const pendingReports = Number(pendingReportsResult?.[0]?.count ?? 0)

  const adminsResult = await (db as any).execute(sql`select count(*)::int as count from users where admin_role in ('admin', 'super_admin') and deleted_at is null`)
  const totalAdmins = Number(adminsResult?.[0]?.count ?? 0)

  const superAdminsResult = await (db as any).execute(sql`select count(*)::int as count from users where admin_role = 'super_admin' and deleted_at is null`)
  const totalSuperAdmins = Number(superAdminsResult?.[0]?.count ?? 0)

  const usersByType = await (db as any).execute(sql`select account_type as "accountType", count(*)::int as count from users group by account_type`)

  return (
    <AdminDashboard
      metrics={{
        totalUsers,
        newUsers30d,
        vipUsers,
        totalMatches,
        totalMessages,
        totalEvents,
        totalReservations,
        activeSubscriptions,
        pendingReports,
        totalAdmins,
        totalSuperAdmins,
        conversionRate: totalUsers > 0 ? Math.round((vipUsers / totalUsers) * 100) : 0,
      }}
      usersByType={usersByType.map((row: { accountType?: string | null; count: number }) => ({
        accountType: row.accountType ?? 'unknown',
        count: row.count,
      }))}
    />
  )
}
