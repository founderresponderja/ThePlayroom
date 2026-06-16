'use client'
import { useRouter } from 'next/navigation'

type Event = {
  id: number
  title: string
  description: string | null
  startsAt: string
  endsAt: string | null    // timestamp nullable in schema
  capacity: number | null
  privacy: string | null
  ticketed: boolean | null
  priceCents: number | null
  locationMode: string | null
  creatorType: string
}

type Props = {
  events: Event[]
  userReservationEventIds: number[]
  isVip: boolean
  locale: string
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('pt-PT', {
    weekday: 'long', day: 'numeric', month: 'long',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function EventsList({ events, userReservationEventIds, isVip, locale }: Props) {
  const router = useRouter()

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '1.5rem' }}>
      <div style={{ maxWidth: '640px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <button
            onClick={() => router.push(`/${locale}/dashboard`)}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.25rem' }}
          >←</button>
          <h1 style={{ color: 'var(--text)', fontSize: '1.25rem', fontWeight: 700 }}>📅 Eventos</h1>
          {isVip && (
            <span style={{ background: 'var(--primary)', color: 'white', fontSize: '0.65rem', padding: '2px 8px', borderRadius: '999px', fontWeight: 700 }}>VIP</span>
          )}
        </div>

        {events.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem 0' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🍍</div>
            <p style={{ color: 'var(--text-muted)' }}>Sem eventos disponíveis de momento.</p>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {events.map(event => {
            const hasReservation = userReservationEventIds.includes(event.id)
            return (
              <div
                key={event.id}
                onClick={() => router.push(`/${locale}/events/${event.id}`)}
                style={{
                  background: 'var(--surface)',
                  border: `1px solid ${hasReservation ? 'var(--primary)' : 'var(--border)'}`,
                  borderRadius: '0.75rem',
                  padding: '1.25rem',
                  cursor: 'pointer',
                  transition: 'border-color 0.2s',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <h2 style={{ color: 'var(--text)', fontSize: '1rem', fontWeight: 600, flex: 1 }}>{event.title}</h2>
                  <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0, marginLeft: '1rem' }}>
                    {isVip && (
                      <span style={{ background: 'var(--surface-2)', color: 'var(--primary)', fontSize: '0.65rem', padding: '2px 6px', borderRadius: '999px', border: '1px solid var(--primary)' }}>
                        Prioridade VIP
                      </span>
                    )}
                    {hasReservation && (
                      <span style={{ background: 'var(--primary)', color: 'white', fontSize: '0.65rem', padding: '2px 8px', borderRadius: '999px' }}>
                        Reservado
                      </span>
                    )}
                  </div>
                </div>

                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.75rem' }}>
                  📅 {formatDate(event.startsAt)}
                </p>

                {event.description && (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.75rem', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {event.description}
                  </p>
                )}

                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {event.capacity && (
                    <span style={{ background: 'var(--surface-2)', color: 'var(--text-muted)', fontSize: '0.75rem', padding: '2px 8px', borderRadius: '999px' }}>
                      👥 {event.capacity} lugares
                    </span>
                  )}
                  {event.ticketed && event.priceCents && (
                    <span style={{ background: 'var(--surface-2)', color: 'var(--text-muted)', fontSize: '0.75rem', padding: '2px 8px', borderRadius: '999px' }}>
                      🎟️ €{(event.priceCents / 100).toFixed(2)}
                    </span>
                  )}
                  <span style={{ background: 'var(--surface-2)', color: 'var(--text-muted)', fontSize: '0.75rem', padding: '2px 8px', borderRadius: '999px' }}>
                    📍 Localização revelada após reserva aceite
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
