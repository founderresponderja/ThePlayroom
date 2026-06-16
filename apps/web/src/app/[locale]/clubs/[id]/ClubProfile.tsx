'use client'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'

const MapView = dynamic(() => import('@/components/MapView'), { ssr: false })

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

type Event = {
  id: number
  title: string
  startsAt: string
  capacity: number | null
  ticketed: boolean | null
  priceCents: number | null
}

type Props = {
  club: Club
  events: Event[]
  hasAcceptedReservation: boolean
  locale: string
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('pt-PT', {
    weekday: 'short', day: 'numeric', month: 'short',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function ClubProfile({ club, events, hasAcceptedReservation, locale }: Props) {
  const router = useRouter()

  // Fuzz coordinates for map display (exact only after accepted reservation)
  const mapLat = club.lat != null ? Math.round(club.lat * 10) / 10 : null
  const mapLng = club.lng != null ? Math.round(club.lng * 10) / 10 : null

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '1.5rem' }}>
      <div style={{ maxWidth: '640px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <button
            onClick={() => router.push(`/${locale}/clubs`)}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.25rem' }}
          >←</button>
          <h1 style={{ color: 'var(--text)', fontSize: '1.25rem', fontWeight: 700 }}>🏛️ {club.name}</h1>
          {club.verified && (
            <span style={{ background: 'var(--surface-2)', color: '#4ade80', fontSize: '0.7rem', padding: '2px 8px', borderRadius: '999px' }}>✅ Verificado</span>
          )}
        </div>

        {/* Map — only show when we have coordinates */}
        {mapLat != null && mapLng != null && (
          <div style={{ marginBottom: '1.5rem' }}>
            <MapView
              lat={hasAcceptedReservation ? (club.lat ?? mapLat) : mapLat}
              lng={hasAcceptedReservation ? (club.lng ?? mapLng) : mapLng}
              exact={hasAcceptedReservation}
              height="250px"
            />
          </div>
        )}

        {/* Club info */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '0.75rem', padding: '1.25rem', marginBottom: '1rem' }}>
          {club.description && (
            <p style={{ color: 'var(--text)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1rem' }}>{club.description}</p>
          )}
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            📍 {hasAcceptedReservation && club.address ? club.address : 'Morada revelada após reserva aceite'}
          </p>
          {club.amenities && club.amenities.length > 0 && (
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
              {club.amenities.map(a => (
                <span key={a} style={{ background: 'var(--surface-2)', color: 'var(--text-muted)', fontSize: '0.75rem', padding: '2px 8px', borderRadius: '999px' }}>{a}</span>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming events */}
        {events.length > 0 && (
          <div>
            <h2 style={{ color: 'var(--text)', fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem' }}>Próximos eventos</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {events.map(event => (
                <div
                  key={event.id}
                  onClick={() => router.push(`/${locale}/events/${event.id}`)}
                  style={{
                    background: 'var(--surface)', border: '1px solid var(--border)',
                    borderRadius: '0.75rem', padding: '1rem', cursor: 'pointer',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}
                >
                  <div>
                    <p style={{ color: 'var(--text)', fontWeight: 600, fontSize: '0.9rem' }}>{event.title}</p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.25rem' }}>📅 {formatDate(event.startsAt)}</p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
                    {event.ticketed && event.priceCents && (
                      <span style={{ color: 'var(--primary)', fontSize: '0.85rem', fontWeight: 600 }}>€{(event.priceCents / 100).toFixed(2)}</span>
                    )}
                    {event.capacity && (
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>👥 {event.capacity}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
