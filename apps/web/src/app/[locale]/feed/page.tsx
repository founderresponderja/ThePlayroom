import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { db, eq } from '@playroom/db'
import { getCurrentUserByClerkId } from '@/lib/current-user'
import FeedClient from './FeedClient'

export default async function FeedPage({ params }: { params: { locale: string } }) {
  const { userId } = await auth()
  if (!userId) redirect(`/${params.locale}/sign-in`)

  const user = await getCurrentUserByClerkId(userId)
  if (!user?.onboardingComplete) redirect(`/${params.locale}/onboarding`)

  return <FeedClient isVip={user.isVip ?? false} />
}
