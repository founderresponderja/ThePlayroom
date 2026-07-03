import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { db, eq, shops, users } from '@playroom/db'
import { stripe } from '@/lib/stripe'

export async function GET() {
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
    return NextResponse.json({ connected: false, shop: null })
  }

  const account = await stripe.accounts.retrieve(shop.stripeConnectAccountId)
  const payoutsEnabled = account.payouts_enabled ?? false
  const chargesEnabled = account.charges_enabled ?? false

  if (payoutsEnabled !== shop.payoutsEnabled) {
    await db.update(shops)
      .set({
        payoutsEnabled,
        status: payoutsEnabled ? 'active' : 'pending',
      })
      .where(eq(shops.id, shop.id))
  }

  return NextResponse.json({
    connected: true,
    payoutsEnabled,
    chargesEnabled,
    shop: {
      id: shop.id,
      name: shop.name,
      status: shop.status,
      verified: shop.verified,
    },
  })
}