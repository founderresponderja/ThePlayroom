'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Event = {
  id: number
  title: string
  description: string | null
  startsAt: string
  endsAt: string | null      // nullable timestamp in schema
  capacity: number | null
  privacy: string | null
  ticketed: boolean | null
  priceCents: number | null
  locationMode: string | null
  customAddress: string | null  // extracted server-side from customLocation jsonb
}

type Club = {
  id: number
  name: string
  address: string | null
  lat: number | null   // extracted server-side from location jsonb
  lng: number | null
} | null

type Reservation = {
  id: number
  status: string
  locationRevealedAt: string | null
} | null

type Props = {
  event: Event
  club: Club
  userReservation: Reservation
  locationRevealed: boolean
  isVip: boolean
  isLoggedIn: boolean
  locale: string
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('pt-PT', {
    weekday: 'long', day: 'numeric', month: 'long',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function EventDetail({
  event, club, userReservation, locationRevealed, isVip, isLoggedIn, locale,
}: Props) {
  const router = useRouter()
  const [loading, setLoading]       = useState(false)
  const [reservation, setReservation] = useState(userReservation)
  const [error, setError]           = useState('')

  const handleReserve = async () => {
    if (!isLoggedIn) { router.push(`/${locale}/sign-in`); return }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId: event.id }),
      })
      const data = (await res.json()) as {
        id: number; status: string; locationRevealedAt: string | null; error?: string
      }
      if (data.error) { setError(data.error); return }
      setReservation(data)
    } catch {
      setError('Erro ao fazer reserva. Tenta novamente.')
    }
    setLoading(false)
  }

  const statusLabels: Record<string, { label: string; color: string }> = {
    requested: { label: 'Aguarda aprovação',   color: '#fbbf24' },
    accepted:  { label: '✅ Aceite',            color: '#4ade80' },
    declined:  { label: '❌ Recusado',          color: '#f87171' },
    waitlist:  { label: '⏳ Lista de espera',   color: '#a78bfa' },
  }

  const reservationStatus = reservation ? statusLabels[reservation.status] : null

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '1.5rem' }}>
      <div style={{ maxWidth: '640px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <button
            onClick={() => router.push(`/${locale}/events`)}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.25rem' }}
          >←</button>
          <h1 style={{ color: 'var(--text)', fontSize: '1.25rem', fontWeight: 700 }}>Detalhe do evento</h1>
        </div>

        {/* Event card */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '1rem', padding: '1.5rem', marginBottom: '1rem' }}>
          <h2 style={{ color: 'var(--text)', fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>{event.title}</h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>📅 Início: {formatDate(event.startsAt)}</p>
            {/* endsAt is nullable */}
            {event.endsAt && (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>🏁 Fim: {formatDate(event.endsAt)}</p>
            )}
            {event.capacity && (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>👥 Capacidade: {event.capacity} pessoas</p>
            )}
            {event.ticketed && event.priceCents && (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>🎟️ Bilhete: €{(event.priceCents / 100).toFixed(2)}</p>
            )}
          </div>

          {event.description && (
            <p style={{ color: 'var(--text)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1rem' }}>{event.description}</p>
          )}

          {/* Location */}
          <div style={{ background: 'var(--surface-2)', borderRadius: '0.5rem', padding: '1rem', marginBottom: '1rem' }}>
            <p style={{ color: 'var(--text)', fontWeight: 600, marginBottom: '0.25rem' }}>📍 Localização</p>
            {locationRevealed ? (
              <div>
                <p style={{ color: '#4ade80', fontSize: '0.85rem', marginBottom: '0.5rem' }}>✅ Localização revelada após reserva aceite</p>
                {club && <p style={{ color: 'var(--text)', fontSize: '0.85rem' }}>{club.name} — {club.address}</p>}
                {event.customAddress && <p style={{ color: 'var(--text)', fontSize: '0.85rem' }}>{event.customAddress}</p>}
              </div>
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                🔒 A localização exacta é revelada apenas após a tua reserva ser aceite.
              </p>
            )}
          </div>

          {/* Club info */}
          {club && (
            <div style={{ background: 'var(--surface-2)', borderRadius: '0.5rem', padding: '1rem', marginBottom: '1rem' }}>
              <p style={{ color: 'var(--text)', fontWeight: 600, marginBottom: '0.25rem' }}>🏛️ {club.name}</p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Área aproximada: ver no mapa</p>
            </div>
          )}
        </div>

        {/* VIP priority badge */}
        {isVip && !reservation && (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--primary)', borderRadius: '0.75rem', padding: '0.75rem 1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: 'var(--primary)', fontSize: '0.85rem' }}>⭐ Como membro VIP, a tua reserva tem prioridade.</span>
          </div>
        )}

        {/* Reservation status */}
        {reservation && reservationStatus && (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '0.75rem', padding: '1rem', marginBottom: '1rem', textAlign: 'center' }}>
            <p style={{ color: reservationStatus.color, fontWeight: 600 }}>{reservationStatus.label}</p>
            {reservation.status === 'waitlist' && (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.25rem' }}>Estás na lista de espera. Serás notificado se houver vaga.</p>
            )}
          </div>
        )}

        {/* Error */}
        {error && (
          <p style={{ color: 'var(--primary)', textAlign: 'center', marginBottom: '1rem', fontSize: '0.85rem' }}>{error}</p>
        )}

        {/* Reserve CTA */}
        {!reservation && (
          <button
            onClick={() => void handleReserve()}
            disabled={loading}
            className="btn-primary"
            style={{ width: '100%', padding: '0.875rem', fontSize: '1rem', opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'A reservar...' : '🍍 Reservar lugar'}
          </button>
        )}

        {reservation?.status === 'declined' && (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', fontSize: '0.85rem' }}>
            A tua reserva foi recusada. Contacta o organizador para mais informações.
          </p>
        )}
      </div>
    </div>
  )
}
