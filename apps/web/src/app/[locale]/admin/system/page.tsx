import { redirect } from 'next/navigation'
import { db } from '@playroom/db'
import { sql } from 'drizzle-orm'
import { isAdmin } from '@/lib/admin'
import SystemHealth from './SystemHealth'

export const dynamic = 'force-dynamic'

export default async function AdminSystemPage({ params }: { params: { locale: string } }) {
  const admin = await isAdmin()
  if (!admin) redirect(`/${params.locale}/dashboard`)

  const totalUsers = await (db as any).execute(sql`select count(*)::int as count from users`)
  const totalMatches = await (db as any).execute(sql`select count(*)::int as count from matches`)
  const totalMessages = await (db as any).execute(sql`select count(*)::int as count from messages`)
  const totalEvents = await (db as any).execute(sql`select count(*)::int as count from events`)
  const totalReservations = await (db as any).execute(sql`select count(*)::int as count from reservations`)
  const totalSubscriptions = await (db as any).execute(sql`select count(*)::int as count from subscriptions`)
  const reservationsByStatus = await (db as any).execute(sql`select status, count(*)::int as count from reservations group by status`)
  const subscriptionsByStatus = await (db as any).execute(sql`select status, count(*)::int as count from subscriptions group by status`)
  const recentUsers = await (db as any).execute(sql`select id, display_name as "displayName", created_at as "createdAt" from users order by created_at desc limit 5`)
  const recentMatches = await (db as any).execute(sql`select id, status, created_at as "createdAt" from matches order by id desc limit 5`)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '1.5rem' }}>
      <h1 style={{ color: 'var(--text)', fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>⚙️ Sistema</h1>
      <SystemHealth metrics={{
        totalUsers: Number(totalUsers?.[0]?.count ?? 0),
        totalMatches: Number(totalMatches?.[0]?.count ?? 0),
        totalMessages: Number(totalMessages?.[0]?.count ?? 0),
        totalEvents: Number(totalEvents?.[0]?.count ?? 0),
        totalReservations: Number(totalReservations?.[0]?.count ?? 0),
        totalSubscriptions: Number(totalSubscriptions?.[0]?.count ?? 0),
        reservationsByStatus: Object.fromEntries(reservationsByStatus.map((row: any) => [row.status, Number(row.count)])),
        subscriptionsByStatus: Object.fromEntries(subscriptionsByStatus.map((row: any) => [row.status, Number(row.count)])),
        recentUsers,
        recentMatches,
        env: {
          NODE_ENV: process.env.NODE_ENV ?? 'development',
          NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
        },
      }} />
    </div>
  )
}
