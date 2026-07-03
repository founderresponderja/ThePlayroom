'use client'

import { useEffect, useState } from 'react'

type SystemHealthProps = {
  metrics: {
    totalUsers: number
    totalMatches: number
    totalMessages: number
    totalEvents: number
    totalReservations: number
    totalSubscriptions: number
    reservationsByStatus: Record<string, number>
    subscriptionsByStatus: Record<string, number>
    recentUsers: Array<{ id: number; displayName: string; createdAt: string }>
    recentMatches: Array<{ id: number; status: string; createdAt: string }>
    env: {
      NODE_ENV: string
      NEXT_PUBLIC_APP_URL?: string
    }
  }
}

export default function SystemHealth({ metrics }: SystemHealthProps) {
  const [csam, setCsam] = useState<{
    pending: number
    clean: number
    flagged: number
    scannerConfigured: boolean
    note: string
  } | null>(null)

  useEffect(() => {
    let active = true

    const load = async () => {
      try {
        const response = await fetch('/api/admin/csam', { cache: 'no-store' })
        if (!response.ok) return

        const data = (await response.json()) as {
          pending: number
          clean: number
          flagged: number
          scannerConfigured: boolean
          note: string
        }

        if (active) setCsam(data)
      } catch {
        // Keep dashboard usable even if CSAM stats endpoint is temporarily unavailable.
      }
    }

    void load()

    return () => {
      active = false
    }
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
        {[
          { label: 'Utilizadores', value: metrics.totalUsers },
          { label: 'Matches', value: metrics.totalMatches },
          { label: 'Mensagens', value: metrics.totalMessages },
          { label: 'Eventos', value: metrics.totalEvents },
          { label: 'Reservas', value: metrics.totalReservations },
          { label: 'Subscrições', value: metrics.totalSubscriptions },
        ].map((item) => (
          <div key={item.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '0.75rem', padding: '1rem' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{item.label}</div>
            <div style={{ color: 'var(--text)', fontSize: '1.25rem', fontWeight: 700 }}>{item.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '0.75rem', padding: '1rem' }}>
          <h2 style={{ color: 'var(--text)', fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem' }}>Reservas por estado</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', color: 'var(--text-muted)' }}>
            {Object.entries(metrics.reservationsByStatus).map(([status, count]) => (
              <div key={status} style={{ display: 'flex', justifyContent: 'space-between' }}><span>{status}</span><strong style={{ color: 'var(--text)' }}>{count}</strong></div>
            ))}
          </div>
        </div>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '0.75rem', padding: '1rem' }}>
          <h2 style={{ color: 'var(--text)', fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem' }}>Subscrições por estado</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', color: 'var(--text-muted)' }}>
            {Object.entries(metrics.subscriptionsByStatus).map(([status, count]) => (
              <div key={status} style={{ display: 'flex', justifyContent: 'space-between' }}><span>{status}</span><strong style={{ color: 'var(--text)' }}>{count}</strong></div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '0.75rem', padding: '1rem' }}>
          <h2 style={{ color: 'var(--text)', fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem' }}>Últimos utilizadores</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {metrics.recentUsers.map((user) => (
              <div key={user.id} style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{user.displayName} • {user.createdAt?.slice(0, 10)}</div>
            ))}
          </div>
        </div>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '0.75rem', padding: '1rem' }}>
          <h2 style={{ color: 'var(--text)', fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem' }}>Últimos matches</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {metrics.recentMatches.map((match) => (
              <div key={match.id} style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{match.id} • {match.status} • {match.createdAt?.slice(0, 10)}</div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '0.75rem', padding: '1rem' }}>
        <h2 style={{ color: 'var(--text)', fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem' }}>Variáveis de ambiente</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', color: 'var(--text-muted)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>NODE_ENV</span><strong style={{ color: 'var(--text)' }}>{metrics.env.NODE_ENV}</strong></div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>NEXT_PUBLIC_APP_URL</span><strong style={{ color: 'var(--text)' }}>{metrics.env.NEXT_PUBLIC_APP_URL ?? '—'}</strong></div>
        </div>
      </div>

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '0.75rem', padding: '1rem' }}>
        <h2 style={{ color: 'var(--text)', fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem' }}>CSAM Pipeline</h2>
        {!csam ? (
          <div style={{ color: 'var(--text-muted)' }}>A carregar estatisticas de seguranca...</div>
        ) : (
          <>
            {!csam.scannerConfigured && (
              <div
                style={{
                  marginBottom: '0.75rem',
                  background: 'rgba(220, 38, 38, 0.15)',
                  border: '1px solid rgba(220, 38, 38, 0.5)',
                  color: '#fecaca',
                  borderRadius: '0.5rem',
                  padding: '0.6rem 0.75rem',
                  fontSize: '0.85rem',
                }}
              >
                Scanner CSAM nao configurado. Uploads devem ser bloqueados em producao.
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', color: 'var(--text-muted)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Scanner configurado</span>
                <strong style={{ color: 'var(--text)' }}>{csam.scannerConfigured ? 'Yes' : 'No'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Fotos analisadas (clean)</span>
                <strong style={{ color: 'var(--text)' }}>{csam.clean}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Fotos sinalizadas</span>
                <strong style={{ color: 'var(--text)' }}>{csam.flagged}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Fotos pendentes</span>
                <strong style={{ color: 'var(--text)' }}>{csam.pending}</strong>
              </div>
            </div>

            <p style={{ marginTop: '0.75rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>{csam.note}</p>
          </>
        )}
      </div>
    </div>
  )
}
