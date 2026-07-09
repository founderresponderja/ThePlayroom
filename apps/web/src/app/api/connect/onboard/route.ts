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
  if (user.accountType !== 'SEX_SHOP') {
    return NextResponse.json({ error: 'Only SEX_SHOP accounts can onboard' }, { status: 403 })
  }

  let shop = await db.query.shops.findFirst({
    where: eq(shops.ownerUserId, user.id),
  })

  let stripeAccountId: string

  if (shop?.stripeConnectAccountId) {
    stripeAccountId = shop.stripeConnectAccountId
  } else {
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'PT',
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      metadata: { userId: String(user.id) },
    })
    stripeAccountId = account.id

    if (!shop) {
      const [newShop] = await db.insert(shops).values({
        ownerUserId: user.id,
        name: user.displayName ?? 'Minha Loja',
        stripeConnectAccountId: stripeAccountId,
        payoutsEnabled: false,
        status: 'pending',
        verified: false,
      }).returning()
      shop = newShop
    } else {
      await db.update(shops)
        .set({ stripeConnectAccountId: stripeAccountId })
        .where(eq(shops.id, shop.id))
    }
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL
  if (!baseUrl) {
    console.error('[connect/onboard] Missing NEXT_PUBLIC_APP_URL')
    return NextResponse.json({ error: 'Server misconfiguration: NEXT_PUBLIC_APP_URL' }, { status: 500 })
  }

  const accountLink = await stripe.accountLinks.create({
    account: stripeAccountId,
    refresh_url: `${baseUrl}/pt/shop-setup?refresh=true`,
    return_url: `${baseUrl}/pt/shop-setup?success=true`,
    type: 'account_onboarding',
  })

  return NextResponse.json({ url: accountLink.url })
}