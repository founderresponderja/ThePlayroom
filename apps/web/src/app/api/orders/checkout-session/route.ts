import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { db, orders, orderItems, products, shops, users, eq, and } from '@playroom/db'

const PLATFORM_FEE_BPS = Number(process.env.MARKETPLACE_DEFAULT_COMMISSION_BPS ?? 1000)

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await db.query.users.findFirst({
    where: eq(users.clerkUserId, userId),
  })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const { orderId } = await req.json() as { orderId: number }

  const order = await db.query.orders.findFirst({
    where: and(
      eq(orders.id, orderId),
      eq(orders.buyerUserId, user.id),
    ),
  })
  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

  const items = await db.query.orderItems.findMany({
    where: eq(orderItems.orderId, orderId),
  })
  if (!items.length) return NextResponse.json({ error: 'No items' }, { status: 400 })

  const firstItem = items[0]!
  const product = await db.query.products.findFirst({
    where: eq(products.id, firstItem.productId),
  })
  const shop = await db.query.shops.findFirst({
    where: eq(shops.id, firstItem.shopId),
  })

  if (!shop?.stripeConnectAccountId) {
    return NextResponse.json({ error: 'Shop not connected' }, { status: 400 })
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://theplayroom.pt'
  const feeCents = Math.round((order.totalCents * PLATFORM_FEE_BPS) / 10000)

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: items.map((item) => ({
      price_data: {
        currency: 'eur',
        unit_amount: item.unitPriceCents,
        product_data: {
          name: product?.title ?? 'Produto',
        },
      },
      quantity: item.qty,
    })),
    payment_intent_data: {
      application_fee_amount: feeCents,
      transfer_data: {
        destination: shop.stripeConnectAccountId,
      },
    },
    success_url: `${baseUrl}/pt/shop/orders?success=true`,
    cancel_url: `${baseUrl}/pt/shop/${firstItem.productId}`,
    metadata: {
      orderId: String(orderId),
      buyerUserId: String(user.id),
    },
  })

  return NextResponse.json({ url: session.url })
}