import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { db, orders, orderItems, products, users, eq } from '@playroom/db'
import OrdersClient from './OrdersClient'

export default async function OrdersPage({
  params,
  searchParams,
}: {
  params: { locale: string }
  searchParams: { success?: string }
}) {
  const { userId } = await auth()
  if (!userId) redirect(`/${params.locale}/sign-in`)

  const user = await db.query.users.findFirst({
    where: eq(users.clerkUserId, userId),
  })
  if (!user) redirect(`/${params.locale}/sign-in`)

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

  return (
    <OrdersClient
      orders={ordersWithItems}
      success={searchParams.success === 'true'}
      locale={params.locale}
    />
  )
}