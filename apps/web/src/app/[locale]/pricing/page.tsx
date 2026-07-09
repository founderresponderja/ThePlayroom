import { auth } from '@clerk/nextjs/server'
import { db, subscriptions, eq } from '@playroom/db'
import { getCurrentUserByClerkId } from '@/lib/current-user'
import PricingClient from './PricingClient'

export default async function PricingPage({ params }: { params: { locale: string } }) {
  const { userId } = await auth()

  let currentUser = null
  let currentSub = null

  if (userId) {
    currentUser = await getCurrentUserByClerkId(userId)
    if (currentUser) {
      currentSub = await db.query.subscriptions.findFirst({
        where: eq(subscriptions.userId, currentUser.id),
      })
    }
  }

  return (
    <PricingClient
      accountType={currentUser?.accountType ?? null}
      isVip={currentUser?.isVip ?? false}
      hasSubscription={!!currentSub}
      locale={params.locale}
    />
  )
}
