'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Props = {
  accountType: string | null
  isVip: boolean
  hasSubscription: boolean
  locale: string
}

const PRICING = {
  FEMALE_SINGLE: { label: 'Single Feminina', monthly: '€9.99', annual: '€89.99', emoji: '👩' },
  MALE_SINGLE:   { label: 'Single Masculino', monthly: '€19.99', annual: '€179.99', emoji: '👨' },
  COUPLE_MF:     { label: 'Casal MF', monthly: '€24.99', annual: '€224.99', emoji: '👫' },
  COUPLE_MM:     { label: 'Casal MM', monthly: '€24.99', annual: '€224.99', emoji: '👬' },
  COUPLE_FF:     { label: 'Casal FF', monthly: '€24.99', annual: '€224.99', emoji: '👭' },
  SWING_CLUB:    { label: 'Swing Club (Gestão de Reservas)', monthly: '€19.99', annual: '€179.99', emoji: '🏛️' },
  SEX_SHOP:      { label: 'Sex Shop (Gestão de Reservas)', monthly: '€19.99', annual: '€179.99', emoji: '🛍️' },
}

const FREE_FEATURES = [
  '5 matches aleatórios por dia',
  '10 mensagens por dia',
  'Ver eventos públicos',
  'Reservar eventos (sem prioridade)',
]

const VIP_FEATURES = [
  'Matches ilimitados',
  'IA matching (compatibilidade real)',
  'Ver quem te deu like',
  'Mensagens ilimitadas',
  'Fotos privadas desbloqueadas',
  'Prioridade em reservas',
  'Filtros avançados (Kink Test)',
]

export default function PricingClient({ accountType, isVip, hasSubscription, locale }: Props) {
  const router = useRouter()
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'annual'>('monthly')
  const [loading, setLoading] = useState(false)

  const pricing = accountType ? PRICING[accountType as keyof typeof PRICING] : null

  const handleUpgrade = async () => {
    setLoading(true)
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ interval: billingInterval }),
    })
    const { url } = (await res.json()) as { url: string }
    if (url) window.location.href = url
    setLoading(false)
  }

  const handleManage = async () => {
    setLoading(true)
    const res = await fetch('/api/stripe/portal', { method: 'POST' })
    const { url } = (await res.json()) as { url: string }
    if (url) window.location.href = url
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '2rem' }}>
      <div style={{ maxWidth: '640px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <button
            onClick={() => router.push(`/${locale}/dashboard`)}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.25rem' }}
          >←</button>
          <h1 style={{ color: 'var(--text)', fontSize: '1.5rem', fontWeight: 700 }}>🍍 Planos</h1>
        </div>

        {/* Interval toggle */}
        <div style={{ display: 'flex', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '0.5rem', padding: '4px', marginBottom: '2rem', width: 'fit-content' }}>
          {(['monthly', 'annual'] as const).map(i => (
            <button
              key={i}
              onClick={() => setBillingInterval(i)}
              style={{
                padding: '0.5rem 1.25rem', borderRadius: '0.375rem', border: 'none',
                cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500,
                background: billingInterval === i ? 'var(--primary)' : 'transparent',
                color: billingInterval === i ? 'white' : 'var(--text-muted)',
                transition: 'all 0.2s',
              }}
            >
              {i === 'monthly' ? 'Mensal' : 'Anual (-25%)'}
            </button>
          ))}
        </div>

        {/* Free plan */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '1rem', padding: '1.5rem', marginBottom: '1rem' }}>
          <h2 style={{ color: 'var(--text)', marginBottom: '0.25rem' }}>Gratuito</h2>
          <p style={{ color: 'var(--primary)', fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem' }}>€0</p>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {FREE_FEATURES.map(f => (
              <li key={f} style={{ color: 'var(--text-muted)', fontSize: '0.85rem', display: 'flex', gap: '0.5rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>○</span> {f}
              </li>
            ))}
          </ul>
        </div>

        {/* VIP plan */}
        <div style={{ background: 'var(--surface)', border: '2px solid var(--primary)', borderRadius: '1rem', padding: '1.5rem', marginBottom: '2rem', position: 'relative' }}>
          <div style={{ position: 'absolute', top: '-12px', left: '1.5rem', background: 'var(--primary)', color: 'white', fontSize: '0.7rem', fontWeight: 700, padding: '2px 10px', borderRadius: '999px' }}>
            RECOMENDADO
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
            <div>
              <h2 style={{ color: 'var(--text)' }}>
                VIP {pricing ? `${pricing.emoji} ${pricing.label}` : ''}
              </h2>
              {isVip && <span style={{ color: '#4ade80', fontSize: '0.8rem' }}>✅ Plano actual</span>}
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ color: 'var(--primary)', fontSize: '1.75rem', fontWeight: 700 }}>
                {pricing ? (billingInterval === 'monthly' ? pricing.monthly : pricing.annual) : '—'}
              </p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                /{billingInterval === 'monthly' ? 'mês' : 'ano'}
              </p>
            </div>
          </div>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
            {VIP_FEATURES.map(f => (
              <li key={f} style={{ color: 'var(--text)', fontSize: '0.85rem', display: 'flex', gap: '0.5rem' }}>
                <span style={{ color: 'var(--primary)' }}>✓</span> {f}
              </li>
            ))}
          </ul>

          {isVip ? (
            <button
              onClick={() => void handleManage()}
              disabled={loading}
              className="btn-outline"
              style={{ width: '100%', padding: '0.875rem', opacity: loading ? 0.7 : 1 }}
            >
              {loading ? 'A redirigir...' : 'Gerir subscrição'}
            </button>
          ) : (
            <button
              onClick={() => void handleUpgrade()}
              disabled={loading || !accountType}
              className="btn-primary"
              style={{ width: '100%', padding: '0.875rem', opacity: loading || !accountType ? 0.7 : 1 }}
            >
              {loading ? 'A redirigir...' : !accountType ? 'Faz login para continuar' : 'Upgradar para VIP 🍍'}
            </button>
          )}
        </div>

        {/* Business note */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '0.75rem', padding: '1rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            🏛️ Swing Clubs e 🛍️ Sex Shops — conta <strong style={{ color: 'var(--text)' }}>sempre gratuita</strong>.
            Gestão de reservas premium por <strong style={{ color: 'var(--text)' }}>€19.99/mês</strong>.
          </p>
        </div>
      </div>
    </div>
  )
}
