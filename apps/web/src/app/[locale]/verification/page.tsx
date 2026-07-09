import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { db } from '@playroom/db'
import { sql } from 'drizzle-orm'
import VerificationClient from './VerificationClient'

export default async function VerificationPage({ params }: { params: { locale: string } }) {
  const { userId } = await auth()
  if (!userId) redirect(`/${params.locale}/sign-in`)

  const userResult = await (db as any).execute(sql`
    select id, verification_level as "verificationLevel"
    from users
    where clerk_user_id = ${userId}
    limit 1
  `)
  const user = userResult?.[0] as { id?: number; verificationLevel?: string } | undefined
  if (!user?.id) redirect(`/${params.locale}/sign-in`)

  const userVerifications = await (db as any).execute(sql`
    select id, type, status
    from verifications
    where user_id = ${user.id}
    order by created_at desc
  `)
  const verifications = (userVerifications ?? []).map((v: any) => ({
    id: v.id,
    type: v.type,
    status: v.status,
  }))

  return (
    <VerificationClient
      currentLevel={user.verificationLevel ?? 'none'}
      verifications={verifications}
      locale={params.locale}
    />
  )
}
