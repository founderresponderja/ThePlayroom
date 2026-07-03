import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { db, orders, users, eq, and } from '@playroom/db'
import CheckoutClient from './CheckoutClient'

export default async function CheckoutPage({
  params,
  searchParams,
}: {
  params: { locale: string }
  searchParams: { orderId?: string }
}) {
  const { userId } = await auth()
  if (!userId) redirect(`/${params.locale}/sign-in`)

  const user = await db.query.users.findFirst({
    where: eq(users.clerkUserId, userId),
  })
  if (!user) redirect(`/${params.locale}/sign-in`)

  if (!searchParams.orderId) redirect(`/${params.locale}/shop`)

  const order = await db.query.orders.findFirst({
    where: and(
      eq(orders.id, Number(searchParams.orderId)),
      eq(orders.buyerUserId, user.id),
    ),
  })
  if (!order || !order.paymentIntentId) redirect(`/${params.locale}/shop`)

  return (
    <CheckoutClient
      orderId={order.id}
      totalCents={order.totalCents}
      stripePublishableKey={process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!}
      locale={params.locale}
    />
  )
}