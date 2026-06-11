'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

type MatchDetail = {
  matchId: number        // matches.id is serial (integer)
  matchedAt: string | null
  user: {
    id: number           // users.id is serial (integer)
    displayName: string | null
    accountType: string | null
    verificationLevel: string | null
    primaryPhoto: string | null
  }
}

export default function MatchesList({ locale }: { locale: string }) {
  const router = useRouter()
  const [matches, setMatches] = useState<MatchDetail[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/matches')
      .then(r => r.json())
      .then((data: MatchDetail[]) => { setMatches(data); setLoading(false) })
      .catch(() => setLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '1.5rem' }}>
      <div style={{ maxWidth: '480px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <button
            onClick={() => router.push(`/${locale}/feed`)}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.25rem' }}
          >←</button>
          <h1 style={{ color: 'var(--text)', fontSize: '1.25rem', fontWeight: 700 }}>💬 Os teus matches</h1>
        </div>

        {loading && <p style={{ color: 'var(--text-muted)' }}>A carregar...</p>}

        {!loading && matches.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem 0' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🍍</div>
            <p style={{ color: 'var(--text-muted)' }}>Ainda não tens matches.</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.5rem' }}>Vai ao feed e dá likes!</p>
            <button
              onClick={() => router.push(`/${locale}/feed`)}
              className="btn-primary"
              style={{ marginTop: '1.5rem', padding: '0.875rem 1.5rem' }}
            >
              Ir para o feed
            </button>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {matches.map(match => (
            <div
              key={match.matchId}
              onClick={() => router.push(`/${locale}/messages/${match.user.id}`)}
              style={{
                display: 'flex', alignItems: 'center', gap: '1rem',
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: '0.75rem', padding: '1rem', cursor: 'pointer',
              }}
            >
              {match.user.primaryPhoto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={match.user.primaryPhoto}
                  alt={match.user.displayName ?? ''}
                  style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                />
              ) : (
                <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0 }}>🍍</div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ color: 'var(--text)', fontWeight: 600 }}>{match.user.displayName ?? 'Anónimo'}</p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Match! Envia uma mensagem 💬</p>
              </div>
              <span style={{ color: 'var(--text-muted)', fontSize: '1.25rem' }}>›</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
