import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { db, reservations, events, eq, and } from '@playroom/db'
import { getCurrentUserByClerkId } from '@/lib/current-user'

export async function GET(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await getCurrentUserByClerkId(userId)
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  // reservations has no createdAt — order by id desc
  const userReservations = await db.query.reservations.findMany({
    where: eq(reservations.userId, user.id),
    orderBy: (r, { desc }) => [desc(r.id)],
  })

  return NextResponse.json(userReservations)
}

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await getCurrentUserByClerkId(userId)
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const { eventId } = (await req.json()) as { eventId: number }
  if (!eventId) return NextResponse.json({ error: 'Missing eventId' }, { status: 400 })

  // Check event exists
  const event = await db.query.events.findFirst({
    where: eq(events.id, eventId),
  })
  if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 })

  // Check capacity
  if (event.capacity) {
    const accepted = await db.query.reservations.findMany({
      where: and(
        eq(reservations.eventId, eventId),
        eq(reservations.status, 'accepted'),
      ),
    })
    if (accepted.length >= event.capacity) {
      // Capacity full — add to waitlist
      const [reservation] = await db
        .insert(reservations)
        .values({
          eventId,
          userId:        user.id,
          status:        'waitlist',
          priorityScore: user.isVip ? 100 : 0,
        })
        .returning()
      return NextResponse.json({ ...reservation, waitlisted: true })
    }
  }

  // Check for duplicate reservation
  const duplicate = await db.query.reservations.findFirst({
    where: and(
      eq(reservations.eventId, eventId),
      eq(reservations.userId, user.id),
    ),
  })
  if (duplicate) return NextResponse.json({ error: 'Already reserved' }, { status: 409 })

  const [reservation] = await db
    .insert(reservations)
    .values({
      eventId,
      userId:        user.id,
      status:        'requested',
      priorityScore: user.isVip ? 100 : 0,
    })
    .returning()

  return NextResponse.json(reservation)
}
