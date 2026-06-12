import { auth } from '@clerk/nextjs/server'
import { db, users, subscriptions, eq } from '@playroom/db'
import PricingClient from './PricingClient'

export default async function PricingPage({ params }: { params: { locale: string } }) {
  const { userId } = await auth()

  let currentUser = null
  let currentSub = null

  if (userId) {
    currentUser = await db.query.users.findFirst({
      where: eq(users.clerkUserId, userId),
    })
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
