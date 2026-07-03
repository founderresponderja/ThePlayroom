'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Props = {
  orderId: number
  totalCents: number
  stripePublishableKey: string
  locale: string
}

export default function CheckoutClient({
  orderId,
  totalCents,
  stripePublishableKey,
  locale,
}: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handlePayment = async () => {
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/orders/checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      })

      const data = await res.json() as { url?: string; error?: string }
      if (data.error) {
        setError(data.error)
        setLoading(false)
        return
      }
      if (data.url) window.location.href = data.url
    } catch {
      setError('Erro ao processar pagamento.')
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '1.5rem' }}>
      <div style={{ maxWidth: '480px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <button
            onClick={() => router.push(`/${locale}/shop`)}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.25rem' }}
          >←</button>
          <h1 style={{ color: 'var(--text)', fontSize: '1.25rem', fontWeight: 700 }}>🔒 Checkout</h1>
        </div>

        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '0.75rem', padding: '1.5rem', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Encomenda #{orderId}</span>
            <span style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '1.25rem' }}>
              €{(totalCents / 100).toFixed(2)}
            </span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '1.5rem' }}>
            Vais ser redirigido para a página segura de pagamento do Stripe.
          </p>
          {error && <p style={{ color: 'var(--primary)', fontSize: '0.85rem', marginBottom: '1rem' }}>{error}</p>}
          <button
            onClick={() => void handlePayment()}
            disabled={loading}
            className="btn-primary"
            style={{ width: '100%', padding: '0.875rem', fontSize: '1rem', opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'A redirigir...' : '💳 Pagar com Stripe'}
          </button>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textAlign: 'center', marginTop: '0.75rem' }}>
            🔒 Pagamento seguro · Direito de devolução: 14 dias (UE)
          </p>
          <input type="hidden" value={stripePublishableKey} readOnly />
        </div>
      </div>
    </div>
  )
}