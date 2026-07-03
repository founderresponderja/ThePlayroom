import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { db, eq, shops, users } from '@playroom/db'
import { stripe } from '@/lib/stripe'

export async function POST() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await db.query.users.findFirst({
    where: eq(users.clerkUserId, userId),
  })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const shop = await db.query.shops.findFirst({
    where: eq(shops.ownerUserId, user.id),
  })
  if (!shop?.stripeConnectAccountId) {
    return NextResponse.json({ error: 'No connected account' }, { status: 404 })
  }

  const loginLink = await stripe.accounts.createLoginLink(shop.stripeConnectAccountId)

  return NextResponse.json({ url: loginLink.url })
}