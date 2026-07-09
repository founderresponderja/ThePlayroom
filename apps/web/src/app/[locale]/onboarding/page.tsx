import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { db } from '@playroom/db'
import { sql } from 'drizzle-orm'
import OnboardingWizard from './OnboardingWizard'

export default async function OnboardingPage({
  params,
}: {
  params: { locale: string }
}) {
  const { userId } = await auth()
  if (!userId) redirect(`/${params.locale}/sign-in`)

  type OnboardingUserRow = {
    id: number
    onboardingComplete: boolean
  }

  let userResult = await (db as any).execute(sql`
    select id, onboarding_complete as "onboardingComplete"
    from users
    where clerk_user_id = ${userId}
    limit 1
  `)
  let user = userResult?.[0] as OnboardingUserRow | undefined

  if (!user) {
    const now = new Date().toISOString()

    await (db as any).execute(sql`
      insert into users (
        clerk_user_id,
        account_type,
        display_name,
        onboarding_complete,
        verification_level,
        subscription_tier,
        is_vip,
        updated_at
      )
      values (
        ${userId},
        'MALE_SINGLE',
        'New User',
        false,
        'none',
        'free',
        false,
        ${now}
      )
      on conflict (clerk_user_id) do nothing
    `)

    userResult = await (db as any).execute(sql`
      select id, onboarding_complete as "onboardingComplete"
      from users
      where clerk_user_id = ${userId}
      limit 1
    `)
    user = userResult?.[0] as OnboardingUserRow | undefined
  }

  if (!user) redirect(`/${params.locale}/sign-in`)
  if (user.onboardingComplete) redirect(`/${params.locale}/dashboard`)

  return <OnboardingWizard />
}
