'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'

type Candidate = {
  id: number          // users.id is serial (integer), not string
  displayName: string | null
  accountType: string | null
  verificationLevel: string | null
  isVip: boolean | null
  bio: string | null
  primaryPhoto: string | null
  photoCount: number
  photos: string[]
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

export default function FeedClient({ isVip }: { isVip: boolean }) {
  const params = useParams()
  const router = useRouter()
  const locale = params.locale as string

  const [candidates, setCandidates]       = useState<Candidate[]>([])
  const [currentIndex, setCurrentIndex]   = useState(0)
  const [loading, setLoading]             = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [mutualMatch, setMutualMatch]     = useState<Candidate | null>(null)
  const [photoIndex, setPhotoIndex]       = useState(0)

  useEffect(() => { void loadFeed() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const loadFeed = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/feed')
      const data = (await res.json()) as Candidate[]
      setCandidates(data)
    } catch { /* ignore */ }
    setLoading(false)
  }

  const handleAction = async (action: 'like' | 'pass') => {
    const candidate = candidates[currentIndex]
    if (!candidate || actionLoading) return
    setActionLoading(true)
    try {
      const res = await fetch('/api/feed/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // candidate.id is number — action route expects number
        body: JSON.stringify({ targetUserId: candidate.id, action }),
      })
      const data = (await res.json()) as { isMutualMatch: boolean }
      if (data.isMutualMatch) setMutualMatch(candidate)
    } catch { /* ignore */ }
    setPhotoIndex(0)
    setCurrentIndex(i => i + 1)
    setActionLoading(false)
  }

  const currentCandidate = candidates[currentIndex]

  // ── Mutual match overlay ────────────────────────────────────────────────────
  if (mutualMatch) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🍍</div>
        <h1 style={{ color: 'var(--primary)', fontSize: '2rem', marginBottom: '0.5rem' }}>É um match!</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Tu e {mutualMatch.displayName} gostaram um do outro.</p>
        {mutualMatch.primaryPhoto && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={mutualMatch.primaryPhoto}
            alt={mutualMatch.displayName ?? ''}
            style={{ width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--primary)', marginBottom: '2rem' }}
          />
        )}
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={() => router.push(`/${locale}/messages`)} className="btn-primary" style={{ padding: '0.875rem 1.5rem' }}>Enviar mensagem</button>
          <button onClick={() => setMutualMatch(null)} className="btn-outline" style={{ padding: '0.875rem 1.5rem' }}>Continuar a explorar</button>
        </div>
      </div>
    )
  }

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>A carregar perfis... 🍍</p>
      </div>
    )
  }

  // ── Empty state ──────────────────────────────────────────────────────────────
  if (!currentCandidate) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🍍</div>
        <h2 style={{ color: 'var(--text)', marginBottom: '0.5rem' }}>Viste tudo por agora</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Volta mais tarde para ver novos perfis.</p>
        <button onClick={() => void loadFeed()} className="btn-primary" style={{ padding: '0.875rem 1.5rem' }}>Actualizar</button>
      </div>
    )
  }

  // ── Card ─────────────────────────────────────────────────────────────────────
  const cardPhotos: (string | null)[] = currentCandidate.photos.length > 0 ? currentCandidate.photos : [null]
  const currentPhoto = cardPhotos[photoIndex] // string | null | undefined

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
        <button onClick={() => router.push(`/${locale}/dashboard`)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.25rem' }}>←</button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ color: 'var(--text)', fontWeight: 700 }}>🍍 Feed</span>
          {isVip && <span style={{ background: 'var(--primary)', color: 'white', fontSize: '0.65rem', padding: '2px 8px', borderRadius: '999px' }}>VIP</span>}
        </div>
        <button onClick={() => router.push(`/${locale}/matches`)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.25rem' }}>💬</button>
      </div>

      {/* Card */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1rem', gap: '1rem' }}>
        <div style={{ position: 'relative', width: '100%', maxWidth: '400px', aspectRatio: '3/4', borderRadius: '1rem', overflow: 'hidden', background: 'var(--surface)' }}>
          {currentPhoto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={currentPhoto} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '4rem' }}>🍍</div>
          )}

          {cardPhotos.length > 1 && (
            <>
              <div
                onClick={() => setPhotoIndex(i => Math.max(0, i - 1))}
                style={{ position: 'absolute', left: 0, top: 0, width: '30%', height: '100%', cursor: 'pointer' }}
              />
              <div
                onClick={() => setPhotoIndex(i => Math.min(cardPhotos.length - 1, i + 1))}
                style={{ position: 'absolute', right: 0, top: 0, width: '30%', height: '100%', cursor: 'pointer' }}
              />
              <div style={{ position: 'absolute', top: '0.75rem', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '4px' }}>
                {cardPhotos.map((_, i) => (
                  <div key={i} style={{ width: '6px', height: '6px', borderRadius: '50%', background: i === photoIndex ? 'white' : 'rgba(255,255,255,0.4)' }} />
                ))}
              </div>
            </>
          )}

          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '45%', background: 'linear-gradient(to top, rgba(11,7,8,0.97), transparent)' }} />
          <div style={{ position: 'absolute', bottom: '1rem', left: '1rem', right: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <h2 style={{ color: 'white', fontSize: '1.4rem', fontWeight: 700 }}>{currentCandidate.displayName ?? 'Anónimo'}</h2>
              {currentCandidate.verificationLevel && currentCandidate.verificationLevel !== 'none' && <span>✅</span>}
              {currentCandidate.isVip && <span style={{ background: 'var(--primary)', color: 'white', fontSize: '0.6rem', padding: '2px 6px', borderRadius: '999px' }}>VIP</span>}
            </div>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem' }}>
              {currentCandidate.accountType ? ACCOUNT_TYPE_LABELS[currentCandidate.accountType] : ''}
            </p>
            {currentCandidate.bio && (
              <p style={{
                color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem', marginTop: '0.25rem',
                overflow: 'hidden', display: '-webkit-box',
                WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
              }}>
                {currentCandidate.bio}
              </p>
            )}
          </div>
        </div>

        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{currentIndex + 1} / {candidates.length}</p>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
          <button
            onClick={() => void handleAction('pass')}
            disabled={actionLoading}
            style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--surface)', border: '2px solid var(--border)', fontSize: '1.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: actionLoading ? 0.5 : 1 }}
          >✕</button>
          <button
            onClick={() => void handleAction('like')}
            disabled={actionLoading}
            style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'var(--primary)', border: 'none', fontSize: '2rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: actionLoading ? 0.5 : 1, boxShadow: '0 4px 20px rgba(255, 31, 61, 0.4)' }}
          >🍍</button>
        </div>
      </div>
    </div>
  )
}
