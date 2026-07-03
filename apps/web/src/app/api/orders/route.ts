import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { db, users, products, shops, orders, orderItems, eq, and } from '@playroom/db'
import { stripe } from '@/lib/stripe'

const PLATFORM_FEE_BPS = Number(process.env.MARKETPLACE_DEFAULT_COMMISSION_BPS ?? 1000)

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await db.query.users.findFirst({
    where: eq(users.clerkUserId, userId),
  })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const userOrders = await db.query.orders.findMany({
    where: eq(orders.buyerUserId, user.id),
    orderBy: (o, { desc }) => [desc(o.id)],
    limit: 20,
  })

  const ordersWithItems = await Promise.all(
    userOrders.map(async (order) => {
      const items = await db.query.orderItems.findMany({
        where: eq(orderItems.orderId, order.id),
      })

      const itemsWithProducts = await Promise.all(
        items.map(async (item) => {
          const product = await db.query.products.findFirst({
            where: eq(products.id, item.productId),
          })
          return { ...item, productTitle: product?.title ?? 'Produto' }
        }),
      )

      return { ...order, items: itemsWithProducts }
    }),
  )

  return NextResponse.json(ordersWithItems)
}

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await db.query.users.findFirst({
    where: eq(users.clerkUserId, userId),
  })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const { productId, qty = 1 } = await req.json() as { productId: number; qty?: number }

  const product = await db.query.products.findFirst({
    where: eq(products.id, productId),
  })
  if (!product || !product.active || product.moderationStatus !== 'approved') {
    return NextResponse.json({ error: 'Product not available' }, { status: 404 })
  }

  const shop = await db.query.shops.findFirst({
    where: eq(shops.id, product.shopId),
  })
  if (!shop?.stripeConnectAccountId || !shop.payoutsEnabled) {
    return NextResponse.json({ error: 'Shop not available' }, { status: 400 })
  }

  const unitPriceCents = product.priceCents
  const totalCents = unitPriceCents * qty
  const feeCents = Math.round((totalCents * PLATFORM_FEE_BPS) / 10000)

  const insertedOrders = await db.insert(orders).values({
    buyerUserId: user.id,
    status: 'pending',
    totalCents,
    platformFeeCents: feeCents,
  }).returning()

  const order = insertedOrders[0]
  if (!order) {
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
  }

  await db.insert(orderItems).values({
    orderId: order.id,
    productId: product.id,
    shopId: shop.id,
    qty,
    unitPriceCents,
    feeCents,
  })

  const paymentIntent = await stripe.paymentIntents.create({
    amount: totalCents,
    currency: 'eur',
    application_fee_amount: feeCents,
    transfer_data: {
      destination: shop.stripeConnectAccountId,
    },
    metadata: {
      orderId: String(order.id),
      buyerUserId: String(user.id),
      productId: String(product.id),
    },
  })

  await db.update(orders)
    .set({ paymentIntentId: paymentIntent.id })
    .where(eq(orders.id, order.id))

  return NextResponse.json({
    clientSecret: paymentIntent.client_secret,
    orderId: order.id,
    totalCents,
    feeCents,
  })
}