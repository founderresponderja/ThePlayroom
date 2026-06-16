'use client'
import { useRouter } from 'next/navigation'

type Club = {
  id: number
  name: string
  description: string | null
  address: string | null
  lat: number | null    // extracted server-side from location jsonb
  lng: number | null
  amenities: string[] | null  // cast server-side from jsonb unknown
  verified: boolean
}

export default function ClubsList({ clubs, locale }: { clubs: Club[]; locale: string }) {
  const router = useRouter()

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '1.5rem' }}>
      <div style={{ maxWidth: '640px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <button
            onClick={() => router.push(`/${locale}/dashboard`)}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.25rem' }}
          >←</button>
          <h1 style={{ color: 'var(--text)', fontSize: '1.25rem', fontWeight: 700 }}>🏛️ Swing Clubs</h1>
        </div>

        {clubs.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem 0' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🍍</div>
            <p style={{ color: 'var(--text-muted)' }}>Sem clubs verificados de momento.</p>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {clubs.map(club => (
            <div
              key={club.id}
              onClick={() => router.push(`/${locale}/clubs/${club.id}`)}
              style={{
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: '0.75rem', padding: '1.25rem', cursor: 'pointer',
                transition: 'border-color 0.2s',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <h2 style={{ color: 'var(--text)', fontSize: '1rem', fontWeight: 600 }}>{club.name}</h2>
                {club.verified && (
                  <span style={{ background: 'var(--surface-2)', color: '#4ade80', fontSize: '0.7rem', padding: '2px 8px', borderRadius: '999px' }}>✅ Verificado</span>
                )}
              </div>
              {club.description && (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.5rem', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                  {club.description}
                </p>
              )}
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>📍 Área aproximada</p>
              {club.amenities && club.amenities.length > 0 && (
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                  {club.amenities.slice(0, 3).map(a => (
                    <span key={a} style={{ background: 'var(--surface-2)', color: 'var(--text-muted)', fontSize: '0.75rem', padding: '2px 8px', borderRadius: '999px' }}>{a}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
