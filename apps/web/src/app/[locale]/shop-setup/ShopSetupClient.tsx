'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Shop = {
  id: number
  name: string
  status: string
  payoutsEnabled: boolean
  stripeConnectAccountId: string | null
} | null

export default function ShopSetupClient({
  shop,
  success,
  locale,
}: {
  shop: Shop
  success: boolean
  locale: string
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleOnboard = async () => {
    setLoading(true)
    const res = await fetch('/api/connect/onboard', { method: 'POST' })
    const data = await res.json() as { url?: string; error?: string }
    if (data.url) window.location.href = data.url
    setLoading(false)
  }

  const handleDashboard = async () => {
    setLoading(true)
    const res = await fetch('/api/connect/dashboard', { method: 'POST' })
    const data = await res.json() as { url?: string }
    if (data.url) window.location.href = data.url
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '2rem' }}>
      <div style={{ maxWidth: '560px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <button
            onClick={() => router.push(`/${locale}/dashboard`)}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.25rem' }}
          >←</button>
          <h1 style={{ color: 'var(--text)', fontSize: '1.25rem', fontWeight: 700 }}>🛍️ Configurar Sex Shop</h1>
        </div>

        {success && (
          <div style={{ background: '#14532d', border: '1px solid #16a34a', borderRadius: '0.75rem', padding: '1rem', marginBottom: '1.5rem' }}>
            <p style={{ color: '#4ade80', fontSize: '0.9rem' }}>✅ Onboarding concluído! A tua loja está a ser activada.</p>
          </div>
        )}

        {!shop?.stripeConnectAccountId ? (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '0.75rem', padding: '1.5rem' }}>
            <h2 style={{ color: 'var(--text)', marginBottom: '0.5rem' }}>Conecta a tua conta de pagamentos</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>
              Para venderes produtos no The Playroom, precisas de configurar uma conta Stripe para receberes pagamentos.
              O processo demora cerca de 5 minutos e requer dados da tua empresa ou identificação pessoal.
            </p>
            <div style={{ background: 'var(--surface-2)', borderRadius: '0.5rem', padding: '1rem', marginBottom: '1.5rem' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.5rem' }}>O que precisas:</p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>• Dados pessoais ou da empresa</p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>• IBAN para receber pagamentos</p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>• Documento de identificação</p>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '1rem' }}>
              Comissão da plataforma: 10% por venda (configurável por categoria, 7%-15%)
            </p>
            <button
              onClick={() => void handleOnboard()}
              disabled={loading}
              className="btn-primary"
              style={{ width: '100%', padding: '0.875rem', opacity: loading ? 0.7 : 1 }}
            >
              {loading ? 'A redirigir...' : '🔗 Conectar conta Stripe'}
            </button>
          </div>
        ) : shop.payoutsEnabled ? (
          <div style={{ background: 'var(--surface)', border: '1px solid #16a34a', borderRadius: '0.75rem', padding: '1.5rem' }}>
            <p style={{ color: '#4ade80', fontWeight: 600, marginBottom: '0.5rem' }}>✅ Loja activa</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              A tua loja está configurada e podes receber pagamentos.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button
                onClick={() => router.push(`/${locale}/shop/products`)}
                className="btn-primary"
                style={{ width: '100%', padding: '0.875rem' }}
              >
                📦 Gerir produtos
              </button>
              <button
                onClick={() => void handleDashboard()}
                disabled={loading}
                className="btn-outline"
                style={{ width: '100%', padding: '0.875rem', opacity: loading ? 0.7 : 1 }}
              >
                {loading ? 'A redirigir...' : '💳 Dashboard Stripe'}
              </button>
            </div>
          </div>
        ) : (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '0.75rem', padding: '1.5rem' }}>
            <p style={{ color: '#fbbf24', fontWeight: 600, marginBottom: '0.5rem' }}>⏳ A aguardar activação</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              O Stripe está a verificar os teus dados. Podes continuar o processo se ficou incompleto.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button
                onClick={() => void handleOnboard()}
                disabled={loading}
                className="btn-primary"
                style={{ width: '100%', padding: '0.875rem', opacity: loading ? 0.7 : 1 }}
              >
                {loading ? 'A redirigir...' : '🔗 Continuar onboarding'}
              </button>
              <button
                onClick={() => void handleDashboard()}
                disabled={loading}
                className="btn-outline"
                style={{ width: '100%', padding: '0.875rem', opacity: loading ? 0.7 : 1 }}
              >
                {loading ? 'A redirigir...' : '💳 Dashboard Stripe'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}