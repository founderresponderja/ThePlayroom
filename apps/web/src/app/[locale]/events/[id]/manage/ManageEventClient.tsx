'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type PendingReservation = {
  id: number
  userId: number
  status: string
  priorityScore: number
  displayName: string
}

export default function ManageEventClient({
  locale,
  event,
  pendingReservations,
}: {
  locale: string
  event: { id: number; title: string }
  pendingReservations: PendingReservation[]
}) {
  const router = useRouter()
  const [items, setItems] = useState(pendingReservations)
  const [acceptingId, setAcceptingId] = useState<number | null>(null)
  const [error, setError] = useState('')

  const acceptReservation = async (reservationId: number) => {
    setError('')
    setAcceptingId(reservationId)

    try {
      const res = await fetch(`/api/reservations/${reservationId}/accept`, {
        method: 'POST',
      })
      const data = (await res.json()) as { error?: string }
      if (!res.ok) {
        throw new Error(data.error ?? 'Falha ao aceitar a reserva.')
      }

      setItems((prev) => prev.filter((reservation) => reservation.id !== reservationId))
    } catch (acceptError) {
      setError(acceptError instanceof Error ? acceptError.message : 'Erro inesperado.')
    } finally {
      setAcceptingId(null)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '1.5rem' }}>
      <div style={{ maxWidth: '760px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
          <button
            onClick={() => router.push(`/${locale}/events/${event.id}`)}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.25rem' }}
          >
            ←
          </button>
          <h1 style={{ color: 'var(--text)', fontSize: '1.25rem', fontWeight: 700 }}>Gestão de Reservas</h1>
        </div>

        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '0.75rem',
            padding: '1rem',
            marginBottom: '1rem',
          }}
        >
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Evento</p>
          <p style={{ color: 'var(--text)', fontWeight: 600 }}>{event.title}</p>
        </div>

        {error && (
          <p style={{ color: '#f87171', marginBottom: '1rem', fontSize: '0.9rem' }}>{error}</p>
        )}

        {items.length === 0 ? (
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '0.75rem',
              padding: '1rem',
            }}
          >
            <p style={{ color: 'var(--text-muted)' }}>Sem reservas pendentes no momento.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {items.map((reservation) => (
              <div
                key={reservation.id}
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: '0.75rem',
                  padding: '1rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '1rem',
                }}
              >
                <div>
                  <p style={{ color: 'var(--text)', fontWeight: 600 }}>{reservation.displayName}</p>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    Reserva #{reservation.id} · Prioridade {reservation.priorityScore}
                  </p>
                </div>

                <button
                  type="button"
                  disabled={acceptingId === reservation.id}
                  onClick={() => void acceptReservation(reservation.id)}
                  className="btn-primary"
                  style={{ padding: '0.55rem 0.85rem', whiteSpace: 'nowrap', opacity: acceptingId === reservation.id ? 0.7 : 1 }}
                >
                  {acceptingId === reservation.id ? 'A aceitar...' : 'Aceitar'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
