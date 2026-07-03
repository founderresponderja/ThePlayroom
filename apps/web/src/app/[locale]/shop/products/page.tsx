import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { db, products, shops, users, eq } from '@playroom/db'
import ProductsManager from './ProductsManager'

export default async function ShopProductsPage({
  params,
}: {
  params: { locale: string }
}) {
  const { userId } = await auth()
  if (!userId) redirect(`/${params.locale}/sign-in`)

  const user = await db.query.users.findFirst({
    where: eq(users.clerkUserId, userId),
  })
  if (!user || user.accountType !== 'SEX_SHOP') {
    redirect(`/${params.locale}/dashboard`)
  }

  const shop = await db.query.shops.findFirst({
    where: eq(shops.ownerUserId, user.id),
  })
  if (!shop?.payoutsEnabled) {
    redirect(`/${params.locale}/shop-setup`)
  }

  const shopProducts = await db.query.products.findMany({
    where: eq(products.shopId, shop.id),
    orderBy: (p, { desc }) => [desc(p.id)],
  })

  return (
    <ProductsManager
      shop={{ id: shop.id, name: shop.name }}
      products={shopProducts}
      locale={params.locale}
    />
  )
}