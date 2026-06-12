'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Props = {
  user: {
    displayName: string | null
    accountType: string | null
    isVip: boolean
    verificationLevel: string
  }
  subscription: {
    plan: string | null
    status: string | null
    currentPeriodEnd: string | null
  } | null
  locale: string
}

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  FEMALE_SINGLE: '👩 Single Feminina',
  MALE_SINGLE:   '👨 Single Masculino',
  COUPLE_MF:     '👫 Casal MF',
  COUPLE_MM:     '👬 Casal MM',
  COUPLE_FF:     '👭 Casal FF',
  SWING_CLUB:    '🏛️ Swing Club',
  SEX_SHOP:      '🛍️ Sex Shop',
}

const VERIFICATION_LABELS: Record<string, string> = {
  none:   'Não verificado',
  photo:  '✅ Verificado por foto',
  video:  '🎥 Verificado por vídeo',
  social: '🔗 Verificado por rede social',
}

export default function AccountClient({ user, subscription, locale }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleManageSubscription = async () => {
    setLoading(true)
    const res = await fetch('/api/stripe/portal', { method: 'POST' })
    const data = (await res.json()) as { url?: string; error?: string }
    if (data.url) window.location.href = data.url
    setLoading(false)
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null
    return new Date(dateStr).toLocaleDateString('pt-PT', {
      day: 'numeric', month: 'long', year: 'numeric',
    })
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '1.5rem' }}>
      <div style={{ maxWidth: '480px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <button
            onClick={() => router.push(`/${locale}/dashboard`)}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.25rem' }}
          >←</button>
          <h1 style={{ color: 'var(--text)', fontSize: '1.25rem', fontWeight: 700 }}>⚙️ Conta</h1>
        </div>

        {/* Profile summary */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '0.75rem', padding: '1.25rem', marginBottom: '1rem' }}>
          <p style={{ color: 'var(--text)', fontWeight: 600, marginBottom: '0.25rem' }}>{user.displayName ?? 'Sem nome'}</p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{user.accountType ? ACCOUNT_TYPE_LABELS[user.accountType] : '—'}</p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>{VERIFICATION_LABELS[user.verificationLevel]}</p>
        </div>

        {/* Subscription */}
        <div style={{ background: 'var(--surface)', border: `1px solid ${user.isVip ? 'var(--primary)' : 'var(--border)'}`, borderRadius: '0.75rem', padding: '1.25rem', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <h2 style={{ color: 'var(--text)', fontSize: '1rem' }}>Subscrição</h2>
            {user.isVip && (
              <span style={{ background: 'var(--primary)', color: 'white', fontSize: '0.65rem', padding: '2px 8px', borderRadius: '999px', fontWeight: 700 }}>VIP</span>
            )}
          </div>

          {subscription && user.isVip ? (
            <>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Estado: <span style={{ color: '#4ade80' }}>{subscription.status}</span>
              </p>
              {subscription.currentPeriodEnd && (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                  Renova a: {formatDate(subscription.currentPeriodEnd)}
                </p>
              )}
              <button
                onClick={() => void handleManageSubscription()}
                disabled={loading}
                className="btn-outline"
                style={{ width: '100%', padding: '0.75rem', marginTop: '1rem', opacity: loading ? 0.7 : 1 }}
              >
                {loading ? 'A redirigir...' : 'Gerir subscrição'}
              </button>
            </>
          ) : (
            <>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                Estás no plano gratuito.
              </p>
              <button
                onClick={() => router.push(`/${locale}/pricing`)}
                className="btn-primary"
                style={{ width: '100%', padding: '0.75rem' }}
              >
                Upgradar para VIP 💎
              </button>
            </>
          )}
        </div>

        {/* Danger zone */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '0.75rem', padding: '1.25rem' }}>
          <h2 style={{ color: 'var(--text)', fontSize: '1rem', marginBottom: '0.75rem' }}>Zona de perigo</h2>
          <button
            onClick={() => {
              if (confirm('Tens a certeza que queres apagar a tua conta? Esta acção é irreversível.')) {
                alert('Funcionalidade em desenvolvimento. Contacta support@theplayroom.pt')
              }
            }}
            style={{ background: 'none', border: '1px solid #ef4444', color: '#ef4444', borderRadius: '0.5rem', padding: '0.625rem 1rem', cursor: 'pointer', fontSize: '0.85rem' }}
          >
            Apagar conta
          </button>
        </div>
      </div>
    </div>
  )
}
