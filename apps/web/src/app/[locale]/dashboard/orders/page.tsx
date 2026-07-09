import { auth } from '@clerk/nextjs/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { db, orderItems, orders, products, users, eq } from '@playroom/db'

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    pending: 'Pendente',
    paid: 'Pago',
    shipped: 'Enviado',
    delivered: 'Entregue',
    refunded: 'Reembolsado',
    cancelled: 'Cancelado',
  }
  return labels[status] ?? status
}

export default async function BuyerOrdersPage({ params }: { params: { locale: string } }) {
  const { userId } = await auth()
  if (!userId) redirect(`/${params.locale}/sign-in`)

  const buyer = await db.query.users.findFirst({
    where: eq(users.clerkUserId, userId),
  })
  if (!buyer) redirect(`/${params.locale}/sign-in`)

  const buyerOrders = await db.query.orders.findMany({
    where: eq(orders.buyerUserId, buyer.id),
    orderBy: (o, { desc }) => [desc(o.id)],
    limit: 50,
  })

  const detailedOrders = await Promise.all(
    buyerOrders.map(async (order) => {
      const items = await db.query.orderItems.findMany({ where: eq(orderItems.orderId, order.id) })
      const withProducts = await Promise.all(
        items.map(async (item) => {
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
        items: withProducts,
      }
    }),
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '2rem' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <h1 style={{ color: 'var(--text)', fontSize: '1.35rem', marginBottom: '0.5rem' }}>🧾 As Minhas Encomendas</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>Acompanha o estado das tuas compras.</p>

        <Link
          href={`/${params.locale}/dashboard`}
          style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textDecoration: 'none', display: 'inline-block', marginBottom: '1rem' }}
        >
          ← Voltar ao dashboard
        </Link>

        {detailedOrders.length === 0 ? (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '0.75rem', padding: '1rem', color: 'var(--text-muted)' }}>
            Ainda não tens encomendas.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {detailedOrders.map((order) => (
              <div key={order.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '0.75rem', padding: '1rem' }}>
                <p style={{ color: 'var(--text)', fontWeight: 700 }}>Encomenda #{order.id}</p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  {order.createdAt ? new Date(order.createdAt).toLocaleString('pt-PT') : '—'}
                </p>
                <p style={{ color: 'var(--text)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                  Total: €{(order.totalCents / 100).toFixed(2)} · Estado: {statusLabel(order.status)}
                </p>

                <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {order.items.map((item) => (
                    <div key={item.id} style={{ background: 'var(--surface-2)', borderRadius: '0.5rem', padding: '0.6rem 0.75rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      {item.productTitle} · {item.qty}x · €{(item.unitPriceCents / 100).toFixed(2)}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
