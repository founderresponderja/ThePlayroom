import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { db, users, eq } from '@playroom/db'
import MatchesList from './MatchesList'

export default async function MatchesPage({ params }: { params: { locale: string } }) {
  const { userId } = await auth()
  if (!userId) redirect(`/${params.locale}/sign-in`)

  const user = await db.query.users.findFirst({
    where: eq(users.clerkUserId, userId),
  })
  if (!user?.onboardingComplete) redirect(`/${params.locale}/onboarding`)

  return <MatchesList locale={params.locale} />
}
