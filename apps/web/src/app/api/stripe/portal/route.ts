import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { db, subscriptions, eq } from '@playroom/db'
import { getCurrentUserByClerkId } from '@/lib/current-user'

export async function POST() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await getCurrentUserByClerkId(userId)
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const sub = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.userId, user.id),
  })
  if (!sub?.stripeCustomerId) {
    return NextResponse.json({ error: 'No subscription found' }, { status: 404 })
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL
  if (!baseUrl) {
    console.error('[stripe/portal] Missing NEXT_PUBLIC_APP_URL')
    return NextResponse.json({ error: 'Server misconfiguration: NEXT_PUBLIC_APP_URL' }, { status: 500 })
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: sub.stripeCustomerId,
    return_url: `${baseUrl}/pt/dashboard`,
  })

  return NextResponse.json({ url: session.url })
}
