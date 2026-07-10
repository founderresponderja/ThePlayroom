import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { db, products, shops, eq, and } from '@playroom/db'
import { ensureCurrentUserByClerkId } from '@/lib/current-user'
import { withDbRetry } from '@/lib/db-observability'

// GET — list all approved products (public storefront)
export async function GET() {
  const allProducts = await withDbRetry('products.listApproved', () =>
    db.query.products.findMany({
      where: and(
        eq(products.active, true),
        eq(products.moderationStatus, 'approved'),
      ),
      orderBy: (p, { desc }) => [desc(p.id)],
      limit: 50,
    })
  )

  return NextResponse.json(allProducts)
}

// POST — create product (seller only)
export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await ensureCurrentUserByClerkId(userId)
  if (!user || user.accountType !== 'SEX_SHOP') {
    return NextResponse.json({ error: 'Only SEX_SHOP accounts can create products' }, { status: 403 })
  }

  const shop = await withDbRetry('products.findSellerShop', () =>
    db.query.shops.findFirst({
      where: eq(shops.ownerUserId, user.id),
    })
  )
  if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 })
  if (!shop.payoutsEnabled) {
    return NextResponse.json({ error: 'Complete Stripe onboarding first' }, { status: 403 })
  }

  const body = await req.json() as {
    title?: string
    description?: string
    priceCents?: number
    category?: string
    stock?: number
    images?: string[]
  }

  if (!body.title || !body.priceCents) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const insertValues: typeof products.$inferInsert = {
    shopId: shop.id,
    title: body.title,
    description: body.description ?? '',
    priceCents: body.priceCents,
    currency: 'EUR',
    category: body.category ?? '',
    stock: body.stock ?? 0,
    images: body.images ?? [],
    ageRestricted: true,
    moderationStatus: 'pending',
    active: false,
  }

  const [product] = await withDbRetry('products.insert', () =>
    db.insert(products).values(insertValues).returning()
  )

  return NextResponse.json(product)
}