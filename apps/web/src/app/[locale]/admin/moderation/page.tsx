import { redirect } from 'next/navigation'
import { db } from '@playroom/db'
import { sql } from 'drizzle-orm'
import { isAdmin } from '@/lib/admin'
import ModerationQueue from './ModerationQueue'

export const dynamic = 'force-dynamic'

export default async function AdminModerationPage({ params }: { params: { locale: string } }) {
  const admin = await isAdmin()
  if (!admin) redirect(`/${params.locale}/dashboard`)

  const photos = await (db as any).execute(sql`
    select
      p.id,
      p.url,
      p.created_at as "createdAt",
      p.review_priority as "reviewPriority",
      p.safe_search_categories as "safeSearchCategories",
      p.safe_search_reason as "safeSearchReason",
      u.display_name as "displayName",
      u.account_type as "accountType"
    from photos p
    join users u on u.id = p.user_id
    where p.moderation_status in ('pending', 'pending_review')
    order by
      case when p.review_priority = 'high' then 0 else 1 end,
      p.id desc
    limit 50
  `)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '1.5rem' }}>
      <h1 style={{ color: 'var(--text)', fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>🖼️ Moderação</h1>
      <ModerationQueue initialPhotos={photos} />
    </div>
  )
}
