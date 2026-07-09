import { auth } from '@clerk/nextjs/server'
import { db, events, reservations, eq, gte, and, or } from '@playroom/db'
import { getCurrentUserByClerkId } from '@/lib/current-user'
import EventsList from './EventsList'

export default async function EventsPage({ params }: { params: { locale: string } }) {
  const { userId } = await auth()

  let currentUser = null
  let userReservationIds: number[] = []

  if (userId) {
    currentUser = await getCurrentUserByClerkId(userId)
    if (currentUser) {
      const userReservations = await db.query.reservations.findMany({
        where: eq(reservations.userId, currentUser.id),
      })
      userReservationIds = userReservations.map(r => r.eventId)
    }
  }

  const upcomingEvents = await db.query.events.findMany({
    where: and(
      gte(events.startsAt, new Date().toISOString()),
      or(eq(events.privacy, 'public')),
    ),
    orderBy: (e, { asc }) => [asc(e.startsAt)],
    limit: 20,
  })

  return (
    <EventsList
      events={upcomingEvents}
      userReservationEventIds={userReservationIds}
      isVip={currentUser?.isVip ?? false}
      locale={params.locale}
    />
  )
}
