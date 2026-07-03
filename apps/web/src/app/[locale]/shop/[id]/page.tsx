import { db, products, shops, eq } from '@playroom/db'
import { redirect } from 'next/navigation'
import ProductDetailClient from './ProductDetailClient'

export default async function ProductDetailPage({
  params,
}: {
  params: { locale: string; id: string }
}) {
  const productId = Number(params.id)
  const product = await db.query.products.findFirst({
    where: eq(products.id, productId),
  })

  if (!product || !product.active || product.moderationStatus !== 'approved') {
    redirect(`/${params.locale}/shop`)
  }

  const shop = await db.query.shops.findFirst({
    where: eq(shops.id, product.shopId),
  })

  const normalizedProduct = {
    ...product,
    images: Array.isArray(product.images) ? product.images.filter((image): image is string => typeof image === 'string') : null,
  }

  return (
    <ProductDetailClient
      product={normalizedProduct}
      shopName={shop?.name ?? 'Loja'}
      locale={params.locale}
    />
  )
}