import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { db, orderItems, orders, products, shops, eq } from '@playroom/db'
import { isAdmin } from '@/lib/admin'
import { sql } from 'drizzle-orm'
import { getCurrentUserByClerkId } from '@/lib/current-user'
import ShopOrdersClient from './ShopOrdersClient'

type SellerOrderRow = {
  id: number
  status: string
  totalCents: number
  createdAt: string | null
  buyerDisplayName: string | null
  items: Array<{
    id: number
    qty: number
    unitPriceCents: number
    productTitle: string
  }>
}

export default async function ShopOrdersPage({ params }: { params: { locale: string } }) {
  const { userId } = await auth()
  if (!userId) redirect(`/${params.locale}/sign-in`)

  const currentUser = await getCurrentUserByClerkId(userId)
  if (!currentUser) redirect(`/${params.locale}/sign-in`)

  const admin = await isAdmin()

  let sellerShopIds: number[] = []
  if (admin) {
    const allShops = await db.query.shops.findMany({
      columns: { id: true },
    })
    sellerShopIds = allShops.map((shop) => shop.id)
  } else {
    const sellerShop = await db.query.shops.findFirst({
      where: eq(shops.ownerUserId, currentUser.id),
    })
    if (!sellerShop) {
      return (
        <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '2rem' }}>
          <div style={{ maxWidth: '760px', margin: '0 auto' }}>
            <h1 style={{ color: 'var(--text)' }}>📦 Encomendas da Loja</h1>
            <p style={{ color: 'var(--text-muted)' }}>Não existe loja associada à tua conta.</p>
          </div>
        </div>
      )
    }

    sellerShopIds = [sellerShop.id]
  }

  const relevantItems = await Promise.all(
    sellerShopIds.map((shopId) => db.query.orderItems.findMany({ where: eq(orderItems.shopId, shopId) })),
  )

  const orderIdSet = new Set<number>()
  for (const items of relevantItems) {
    for (const item of items) {
      orderIdSet.add(item.orderId)
    }
  }

  const orderIds = Array.from(orderIdSet)

  const orderRows: SellerOrderRow[] = await Promise.all(
    orderIds.map(async (orderId) => {
      const order = await db.query.orders.findFirst({ where: eq(orders.id, orderId) })
      if (!order) {
        return {
          id: orderId,
          status: 'unknown',
          totalCents: 0,
          createdAt: null,
          buyerDisplayName: null,
          items: [],
        }
      }

      const buyerResult = await (db as any).execute(sql`
        select id, display_name as "displayName"
        from users
        where id = ${order.buyerUserId}
        limit 1
      `)
      const buyer = buyerResult?.[0] as { id: number; displayName: string | null } | undefined

      const scopedItems = await db.query.orderItems.findMany({ where: eq(orderItems.orderId, order.id) })
      const filteredItems = scopedItems.filter((item) => sellerShopIds.includes(item.shopId))

      const itemsWithProductTitle = await Promise.all(
        filteredItems.map(async (item) => {
          const product = await db.query.products.findFirst({ where: eq(products.id, item.productId) })
          return {
            id: item.id,
            qty: item.qty,
            unitPriceCents: item.unitPriceCents,
            productTitle: product?.title ?? `Produto #${item.productId}`,
          }
        }),
      )

      return {
        id: order.id,
        status: order.status,
        totalCents: order.totalCents,
        createdAt: order.createdAt,
        buyerDisplayName: buyer?.displayName ?? null,
        items: itemsWithProductTitle,
      }
    }),
  )

  const filteredRows = orderRows.filter((row) => row.items.length > 0)
  filteredRows.sort((a, b) => b.id - a.id)

  return <ShopOrdersClient locale={params.locale} initialOrders={filteredRows} />
}
