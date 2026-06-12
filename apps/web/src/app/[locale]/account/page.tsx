import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { db, users, subscriptions, eq } from '@playroom/db'
import AccountClient from './AccountClient'

export default async function AccountPage({ params }: { params: { locale: string } }) {
  const { userId } = await auth()
  if (!userId) redirect(`/${params.locale}/sign-in`)

  const user = await db.query.users.findFirst({
    where: eq(users.clerkUserId, userId),
  })
  if (!user) redirect(`/${params.locale}/sign-in`)

  const sub = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.userId, user.id),
  })

  return (
    <AccountClient
      user={{
        displayName:       user.displayName,
        accountType:       user.accountType,
        isVip:             user.isVip ?? false,
        verificationLevel: user.verificationLevel ?? 'none',
      }}
      subscription={
        sub
          ? {
              plan:             sub.plan,
              status:           sub.status,
              currentPeriodEnd: sub.currentPeriodEnd,
            }
          : null
      }
      locale={params.locale}
    />
  )
}
