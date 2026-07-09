import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { db, users, eq } from '@playroom/db'
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

    await db
      .insert(users)
      .values({
        clerkUserId: userId,
        accountType: 'MALE_SINGLE',
        displayName: 'New User',
        onboardingComplete: false,
        verificationLevel: 'none',
        subscriptionTier: 'free',
        isVip: false,
        updatedAt: now,
      })
      .onConflictDoNothing({ target: users.clerkUserId })

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
