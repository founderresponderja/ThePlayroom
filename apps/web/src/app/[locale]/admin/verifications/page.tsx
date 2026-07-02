import { isAdmin } from '@/lib/admin'
import { redirect } from 'next/navigation'
import VerificationQueue from './VerificationQueue'
import { db } from '@playroom/db'
import { sql } from 'drizzle-orm'

export default async function AdminVerificationsPage({ params }: { params: { locale: string } }) {
  const admin = await isAdmin()
  if (!admin) redirect(`/${params.locale}/dashboard`)

  const verifications = await (db as any).execute(sql`
    select v.id, v.user_id as "userId", v.type, v.status, v.evidence_ref as "evidenceRef", v.created_at as "createdAt",
           u.id as "userIdRef", u.display_name as "displayName", u.account_type as "accountType"
    from verifications v
    left join users u on u.id = v.user_id
    where v.status = 'pending'
    order by v.created_at asc
    limit 50
  `)

  return <VerificationQueue verifications={verifications} locale={params.locale} />
}
