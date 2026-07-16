import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db, orderItems, orders, shops, orderStatusEnum, eq } from '@playroom/db'
import { getValidClerkSession } from '@/lib/auth'
import { isAdmin } from '@/lib/admin'
import { getCurrentUserByClerkId } from '@/lib/current-user'
import { applyRateLimit } from '@/lib/rate-limit-middleware'

const patchOrderSchema = z.object({
  status: z.enum(['shipped']),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { userId } = await getValidClerkSession(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rateLimit = await applyRateLimit(userId, 'ORDERS_CREATE')
  if (!rateLimit.allowed) {
    return rateLimit.response ?? NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
  }

  const parsedOrderId = Number(params.id)
  if (!Number.isInteger(parsedOrderId) || parsedOrderId <= 0) {
    return NextResponse.json({ error: 'Invalid order id' }, { status: 400 })
  }

  let payload: z.infer<typeof patchOrderSchema>
  try {
    const parsed = patchOrderSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid status payload' }, { status: 400 })
    }
    payload = parsed.data
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const order = await db.query.orders.findFirst({
    where: eq(orders.id, parsedOrderId),
  })
  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

  const orderItemRows = await db.query.orderItems.findMany({
    where: eq(orderItems.orderId, parsedOrderId),
  })
  if (!orderItemRows.length) {
    return NextResponse.json({ error: 'Order has no items' }, { status: 400 })
  }

  const admin = await isAdmin()
  if (!admin) {
    const currentUser = await getCurrentUserByClerkId(userId)
    if (!currentUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const sellerShop = await db.query.shops.findFirst({
      where: eq(shops.ownerUserId, currentUser.id),
    })
    if (!sellerShop) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 })
    }

    const ownsAllItems = orderItemRows.every((item) => item.shopId === sellerShop.id)
    if (!ownsAllItems) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  if (payload.status === 'shipped') {
    if (order.status !== orderStatusEnum.enumValues[1]) {
      return NextResponse.json(
        { error: `Order must be ${orderStatusEnum.enumValues[1]} before shipping` },
        { status: 409 },
      )
    }

    const updated = await db
      .update(orders)
      .set({ status: orderStatusEnum.enumValues[2] })
      .where(eq(orders.id, parsedOrderId))
      .returning()

    return NextResponse.json(updated[0] ?? null)
  }

  return NextResponse.json({ error: 'Unsupported status transition' }, { status: 400 })
}
