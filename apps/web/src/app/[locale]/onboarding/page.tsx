import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { db, users, eq } from '@playroom/db'
import OnboardingWizard from './OnboardingWizard'

interface OnboardingPageProps {
  params: { locale: string }
}

export default async function OnboardingPage({ params }: OnboardingPageProps) {
  const { userId } = await auth()

  if (!userId) {
    redirect(`/${params.locale}/sign-in`)
  }

  const user = await db.query.users.findFirst({
    where: eq(users.clerkUserId, userId),
  })

  if (user?.onboardingComplete) {
    redirect(`/${params.locale}/dashboard`)
  }

  return <OnboardingWizard />
}
