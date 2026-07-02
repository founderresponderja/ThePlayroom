import { redirect } from 'next/navigation'
import { db } from '@playroom/db'
import { sql } from 'drizzle-orm'
import { isAdmin } from '@/lib/admin'
import ReportsQueue from './ReportsQueue'

export const dynamic = 'force-dynamic'

export default async function AdminReportsPage({ params }: { params: { locale: string } }) {
  const admin = await isAdmin()
  if (!admin) redirect(`/${params.locale}/dashboard`)

  const reports = await (db as any).execute(sql`select r.id, r.reason, r.target_type as "targetType", r.created_at as "createdAt", reporter.display_name as "reporterName", target.display_name as "targetName" from reports r join users reporter on reporter.id = r.reporter_user_id join users target on target.id = r.target_id where r.status = 'open' order by r.created_at desc limit 50`)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '1.5rem' }}>
      <h1 style={{ color: 'var(--text)', fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>🚨 Reports</h1>
      <ReportsQueue initialReports={reports} />
    </div>
  )
}
