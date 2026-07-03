import { db, eq, and, products, shops } from '@playroom/db'
import StorefrontClient from './StorefrontClient'

export default async function StorefrontPage({
  params,
}: {
  params: { locale: string }
}) {
  const approvedProducts = await db.query.products.findMany({
    where: and(
      eq(products.active, true),
      eq(products.moderationStatus, 'approved'),
    ),
    orderBy: (p, { asc }) => [asc(p.id)],
    limit: 50,
  })

  const productsWithShop = await Promise.all(
    approvedProducts.map(async (product) => {
      const shop = await db.query.shops.findFirst({
        where: eq(shops.id, product.shopId),
      })

      return {
        ...product,
        images: Array.isArray(product.images) ? product.images.filter((image): image is string => typeof image === 'string') : null,
        shopName: shop?.name ?? 'Loja',
      }
    }),
  )

  return (
    <StorefrontClient
      products={productsWithShop}
      locale={params.locale}
    />
  )
}