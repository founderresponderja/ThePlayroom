import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { db, eq, shops } from '@playroom/db'
import { getCurrentUserByClerkId } from '@/lib/current-user'
import ShopSetupClient from './ShopSetupClient'

export default async function ShopSetupPage({
  params,
  searchParams,
}: {
  params: { locale: string }
  searchParams: { success?: string; refresh?: string }
}) {
  const { userId } = await auth()
  if (!userId) redirect(`/${params.locale}/sign-in`)

  const user = await getCurrentUserByClerkId(userId)
  if (!user || user.accountType !== 'SEX_SHOP') {
    redirect(`/${params.locale}/dashboard`)
  }

  const shop = await db.query.shops.findFirst({
    where: eq(shops.ownerUserId, user.id),
  })

  return (
    <ShopSetupClient
      shop={shop ? {
        id: shop.id,
        name: shop.name,
        status: shop.status ?? 'pending',
        payoutsEnabled: shop.payoutsEnabled ?? false,
        stripeConnectAccountId: shop.stripeConnectAccountId,
      } : null}
      success={searchParams.success === 'true'}
      locale={params.locale}
    />
  )
}
