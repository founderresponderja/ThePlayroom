import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { stripe, PRICE_MAP } from '@/lib/stripe'
import { db, users, subscriptions, eq } from '@playroom/db'

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { interval } = (await req.json()) as { interval: 'monthly' | 'annual' }

  const user = await db.query.users.findFirst({
    where: eq(users.clerkUserId, userId),
  })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const accountType = user.accountType ?? 'MALE_SINGLE'
  const prices = PRICE_MAP[accountType]
  if (!prices) return NextResponse.json({ error: 'No price for account type' }, { status: 400 })

  const priceId = interval === 'annual' ? prices.annual : prices.monthly

  // Get or create Stripe customer
  let stripeCustomerId: string

  const existingSub = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.userId, user.id),
  })

  if (existingSub?.stripeCustomerId) {
    stripeCustomerId = existingSub.stripeCustomerId
  } else {
    // users table has no email column — Clerk manages email server-side
    const customer = await stripe.customers.create({
      metadata: { userId: String(user.id), clerkUserId: userId },
    })
    stripeCustomerId = customer.id
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL
  if (!baseUrl) {
    console.error('[stripe/checkout] Missing NEXT_PUBLIC_APP_URL')
    return NextResponse.json({ error: 'Server misconfiguration: NEXT_PUBLIC_APP_URL' }, { status: 500 })
  }

  const session = await stripe.checkout.sessions.create({
    customer: stripeCustomerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${baseUrl}/pt/dashboard?upgraded=true`,
    cancel_url: `${baseUrl}/pt/pricing`,
    metadata: { userId: String(user.id) },
  })

  return NextResponse.json({ url: session.url })
}
