'use client'

import { useState } from 'react'

type SellerOrderItem = {
  id: number
  qty: number
  unitPriceCents: number
  productTitle: string
}

type SellerOrder = {
  id: number
  status: string
  totalCents: number
  createdAt: string | null
  buyerDisplayName: string | null
  items: SellerOrderItem[]
}

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

export default function ShopOrdersClient({
  locale,
  initialOrders,
}: {
  locale: string
  initialOrders: SellerOrder[]
}) {
  const [orders, setOrders] = useState(initialOrders)
  const [loadingOrderId, setLoadingOrderId] = useState<number | null>(null)
  const [error, setError] = useState('')

  const markAsShipped = async (orderId: number) => {
    setError('')
    setLoadingOrderId(orderId)

    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'shipped' }),
      })
      const data = (await res.json()) as { error?: string; status?: string }
      if (!res.ok) {
        throw new Error(data.error ?? 'Falha ao atualizar encomenda')
      }

      setOrders((prev) => prev.map((order) => (
        order.id === orderId
          ? { ...order, status: data.status ?? 'shipped' }
          : order
      )))
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Erro inesperado.')
    }

    setLoadingOrderId(null)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '2rem' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <h1 style={{ color: 'var(--text)', fontSize: '1.35rem', marginBottom: '0.5rem' }}>📦 Encomendas da Loja</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
          Acompanha pedidos pagos e marca-os como enviados.
        </p>

        <a
          href={`/${locale}/dashboard`}
          style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textDecoration: 'none', display: 'inline-block', marginBottom: '1rem' }}
        >
          ← Voltar ao dashboard
        </a>

        {error && (
          <div style={{ marginBottom: '1rem', border: '1px solid #7f1d1d', background: '#450a0a', color: '#fecaca', borderRadius: '0.75rem', padding: '0.75rem 1rem' }}>
            {error}
          </div>
        )}

        {orders.length === 0 ? (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '0.75rem', padding: '1rem', color: 'var(--text-muted)' }}>
            Sem encomendas para a tua loja.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {orders.map((order) => (
              <div key={order.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '0.75rem', padding: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                  <div>
                    <p style={{ color: 'var(--text)', fontWeight: 700 }}>Encomenda #{order.id}</p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      Buyer: {order.buyerDisplayName ?? 'Utilizador'} · {order.createdAt ? new Date(order.createdAt).toLocaleString('pt-PT') : '—'}
                    </p>
                    <p style={{ color: 'var(--text)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                      Total: €{(order.totalCents / 100).toFixed(2)} · Estado: {statusLabel(order.status)}
                    </p>
                  </div>

                  {order.status === 'paid' && (
                    <button
                      onClick={() => void markAsShipped(order.id)}
                      disabled={loadingOrderId === order.id}
                      className="btn-primary"
                      style={{ padding: '0.625rem 0.9rem', opacity: loadingOrderId === order.id ? 0.7 : 1 }}
                    >
                      {loadingOrderId === order.id ? 'A atualizar...' : 'Marcar como Enviado'}
                    </button>
                  )}
                </div>

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
