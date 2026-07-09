import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { db, reservations, events, eq } from '@playroom/db'
import { notifyUser } from '@/lib/notifications'
import { getCurrentUserByClerkId } from '@/lib/current-user'

export async function POST(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const reservationId = Number(params.id)
  if (!Number.isInteger(reservationId) || reservationId <= 0) {
    return NextResponse.json({ error: 'Invalid reservation id' }, { status: 400 })
  }

  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const currentUser = await getCurrentUserByClerkId(userId)
  if (!currentUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const reservation = await db.query.reservations.findFirst({
    where: eq(reservations.id, reservationId),
  })
  if (!reservation) return NextResponse.json({ error: 'Reservation not found' }, { status: 404 })

  const event = await db.query.events.findFirst({
    where: eq(events.id, reservation.eventId),
  })
  if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 })

  // Only the event creator can accept reservations
  if (event.creatorId !== currentUser.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (reservation.status !== 'requested' && reservation.status !== 'waitlist') {
    return NextResponse.json(
      { error: `Cannot accept reservation with status ${reservation.status}` },
      { status: 409 },
    )
  }

  const [updated] = await db
    .update(reservations)
    .set({
      status:             'accepted',
      locationRevealedAt: new Date().toISOString(),
    })
    .where(eq(reservations.id, reservationId))
    .returning()

  await notifyUser(reservation.userId, {
    title: '✅ Reserva aceite!',
    body: 'A tua reserva foi aceite. A localização foi revelada.',
    url: `/pt/events/${reservation.eventId}`,
  })

  return NextResponse.json(updated)
}
