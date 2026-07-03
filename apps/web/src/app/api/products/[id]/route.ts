import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { db, products, shops, users, eq, and } from '@playroom/db'

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const productId = Number(params.id)
  if (Number.isNaN(productId)) {
    return NextResponse.json({ error: 'Invalid product id' }, { status: 400 })
  }

  const product = await db.query.products.findFirst({
    where: eq(products.id, productId),
  })
  if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  return NextResponse.json(product)
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await db.query.users.findFirst({
    where: eq(users.clerkUserId, userId),
  })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const shop = await db.query.shops.findFirst({
    where: eq(shops.ownerUserId, user.id),
  })
  if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 })

  const productId = Number(params.id)
  if (Number.isNaN(productId)) {
    return NextResponse.json({ error: 'Invalid product id' }, { status: 400 })
  }

  const product = await db.query.products.findFirst({
    where: and(
      eq(products.id, productId),
      eq(products.shopId, shop.id),
    ),
  })
  if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 })

  const body = await req.json() as Partial<{
    title: string
    description: string
    priceCents: number
    category: string
    stock: number
    active: boolean
  }>

  const updates: Partial<typeof product> = {}
  if (typeof body.title === 'string') updates.title = body.title
  if (typeof body.description === 'string') updates.description = body.description
  if (typeof body.priceCents === 'number') updates.priceCents = body.priceCents
  if (typeof body.category === 'string') updates.category = body.category
  if (typeof body.stock === 'number') updates.stock = body.stock
  if (typeof body.active === 'boolean') updates.active = body.active

  const [updated] = await db.update(products)
    .set(updates)
    .where(eq(products.id, productId))
    .returning()

  return NextResponse.json(updated)
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await db.query.users.findFirst({
    where: eq(users.clerkUserId, userId),
  })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const shop = await db.query.shops.findFirst({
    where: eq(shops.ownerUserId, user.id),
  })
  if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 })

  const productId = Number(params.id)
  if (Number.isNaN(productId)) {
    return NextResponse.json({ error: 'Invalid product id' }, { status: 400 })
  }

  await db.update(products)
    .set({ active: false })
    .where(and(
      eq(products.id, productId),
      eq(products.shopId, shop.id),
    ))

  return NextResponse.json({ success: true })
}