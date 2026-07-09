import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { db, users, eq } from '@playroom/db'
import OnboardingWizard from './OnboardingWizard'

export default async function OnboardingPage({
  params,
}: {
  params: { locale: string }
}) {
  const { userId } = await auth()
  if (!userId) redirect(`/${params.locale}/sign-in`)

  let user = await db.query.users.findFirst({
    where: eq(users.clerkUserId, userId),
  })

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

    user = await db.query.users.findFirst({
      where: eq(users.clerkUserId, userId),
    })
  }

  if (!user) redirect(`/${params.locale}/sign-in`)
  if (user.onboardingComplete) redirect(`/${params.locale}/dashboard`)

  return <OnboardingWizard />
}
