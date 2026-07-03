import Stripe from 'stripe'
import { headers } from 'next/headers'
import { db, subscriptions, users, entitlements, orders, eq } from '@playroom/db'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
})

export async function POST(req: Request) {
  const body = await req.text()
  const signature = headers().get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    )
  } catch {
    return new Response('Invalid signature', { status: 400 })
  }

  // ── checkout.session.completed ───────────────────────────────────────────────
  // Create a stub subscription record linking userId → stripeCustomerId.
  // The full details (stripeSubscriptionId, plan, currentPeriodEnd) arrive via
  // the customer.subscription.created event that fires immediately after.
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const userId = session.metadata?.userId
    if (userId && session.customer) {
      const customerId = session.customer as string

      const existing = await db.query.subscriptions.findFirst({
        where: eq(subscriptions.userId, Number(userId)),
      })

      if (!existing) {
        // subscriptions.stripeSubscriptionId and .plan are notNull —
        // seed with stubs that will be overwritten by subscription.created
        await db.insert(subscriptions).values({
          userId:               Number(userId),
          stripeCustomerId:     customerId,
          stripeSubscriptionId: '',       // updated by customer.subscription.created
          plan:                 '',       // updated by customer.subscription.created
          status:               'pending',
        })
      } else {
        // Just update the customer ID on the existing row
        // (no updatedAt column on subscriptions table)
        await db
          .update(subscriptions)
          .set({ stripeCustomerId: customerId })
          .where(eq(subscriptions.userId, Number(userId)))
      }
    }

      const orderId = session.metadata?.orderId
      if (orderId) {
        await db.update(orders)
          .set({ status: 'paid' })
          .where(eq(orders.id, Number(orderId)))
      }
  }

  // ── customer.subscription.created / updated ─────────────────────────────────
  if (
    event.type === 'customer.subscription.created' ||
    event.type === 'customer.subscription.updated'
  ) {
    const sub    = event.data.object as Stripe.Subscription
    const customerId = sub.customer as string
    const isActive   = sub.status === 'active' || sub.status === 'trialing'

    const existingSub = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.stripeCustomerId, customerId),
    })

    if (existingSub) {
      // subscriptions table has no updatedAt column
      await db
        .update(subscriptions)
        .set({
          stripeSubscriptionId: sub.id,
          // plan is notNull — fall back to '' rather than null
          plan:             sub.items.data[0]?.price.id ?? '',
          status:           sub.status,
          currentPeriodEnd: new Date(sub.current_period_end * 1000).toISOString(),
        })
        .where(eq(subscriptions.stripeCustomerId, customerId))

      // Flip isVip on user (users table DOES have updatedAt)
      await db
        .update(users)
        .set({
          isVip:             isActive,
          subscriptionTier:  isActive ? 'vip' : 'free',
          updatedAt:         new Date().toISOString(),
        })
        .where(eq(users.id, existingSub.userId))

      // Sync entitlements — entitlements table has no updatedAt column
      if (isActive) {
        const vipFeatures = [
          'ai_matching', 'unlimited_matches', 'unlimited_messages',
          'private_photos', 'reservation_priority', 'advanced_filters', 'see_likes',
        ]
        for (const feature of vipFeatures) {
          const existing = await db.query.entitlements.findFirst({
            where: eq(entitlements.userId, existingSub.userId),
          })
          if (!existing) {
            await db
              .insert(entitlements)
              .values({
                userId:  existingSub.userId,
                feature,
                active:  true,
                source:  'stripe_sub',
              })
              .onConflictDoNothing()
          }
        }
      }
    }
  }

  // ── customer.subscription.deleted ───────────────────────────────────────────
  if (event.type === 'customer.subscription.deleted') {
    const sub        = event.data.object as Stripe.Subscription
    const customerId = sub.customer as string

    const existingSub = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.stripeCustomerId, customerId),
    })

    // subscriptions table has no updatedAt column
    await db
      .update(subscriptions)
      .set({ status: 'canceled' })
      .where(eq(subscriptions.stripeCustomerId, customerId))

    if (existingSub) {
      await db
        .update(users)
        .set({
          isVip:            false,
          subscriptionTier: 'free',
          updatedAt:        new Date().toISOString(),
        })
        .where(eq(users.id, existingSub.userId))

      // Deactivate entitlements — entitlements table has no updatedAt column
      await db
        .update(entitlements)
        .set({ active: false })
        .where(eq(entitlements.userId, existingSub.userId))
    }
  }

  console.log('[Stripe Webhook]', event.type)
  return new Response('OK', { status: 200 })
}
