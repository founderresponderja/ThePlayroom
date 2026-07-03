'use client'

import { useRouter } from 'next/navigation'

type OrderItem = {
  id: number
  productTitle: string
  qty: number
  unitPriceCents: number
}

type Order = {
  id: number
  status: string | null
  totalCents: number
  items: OrderItem[]
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pendente', color: '#fbbf24' },
  paid: { label: '✅ Pago', color: '#4ade80' },
  shipped: { label: '📦 Enviado', color: '#60a5fa' },
  delivered: { label: '✅ Entregue', color: '#4ade80' },
  refunded: { label: '↩️ Reembolsado', color: '#a78bfa' },
  cancelled: { label: '❌ Cancelado', color: '#f87171' },
}

export default function OrdersClient({
  orders,
  success,
  locale,
}: {
  orders: Order[]
  success: boolean
  locale: string
}) {
  const router = useRouter()

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '1.5rem' }}>
      <div style={{ maxWidth: '640px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <button
            onClick={() => router.push(`/${locale}/shop`)}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.25rem' }}
          >←</button>
          <h1 style={{ color: 'var(--text)', fontSize: '1.25rem', fontWeight: 700 }}>📦 As minhas encomendas</h1>
        </div>

        {success && (
          <div style={{ background: '#14532d', border: '1px solid #16a34a', borderRadius: '0.75rem', padding: '1rem', marginBottom: '1.5rem' }}>
            <p style={{ color: '#4ade80' }}>✅ Pagamento efectuado com sucesso! A tua encomenda está a ser processada.</p>
          </div>
        )}

        {orders.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem 0' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📦</div>
            <p style={{ color: 'var(--text-muted)' }}>Ainda não tens encomendas.</p>
            <button
              onClick={() => router.push(`/${locale}/shop`)}
              className="btn-primary"
              style={{ marginTop: '1.5rem', padding: '0.875rem 1.5rem' }}
            >
              Ir ao marketplace
            </button>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {orders.map((order) => {
            const statusInfo = STATUS_LABELS[order.status ?? 'pending']
            return (
              <div
                key={order.id}
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '0.75rem', padding: '1.25rem' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div>
                    <p style={{ color: 'var(--text)', fontWeight: 600 }}>Encomenda #{order.id}</p>
                    <p style={{ color: statusInfo?.color ?? 'var(--text-muted)', fontSize: '0.85rem' }}>
                      {statusInfo?.label ?? order.status}
                    </p>
                  </div>
                  <p style={{ color: 'var(--primary)', fontWeight: 700 }}>
                    €{(order.totalCents / 100).toFixed(2)}
                  </p>
                </div>
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
                  {order.items.map((item) => (
                    <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        {item.productTitle} × {item.qty}
                      </p>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        €{((item.unitPriceCents * item.qty) / 100).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}