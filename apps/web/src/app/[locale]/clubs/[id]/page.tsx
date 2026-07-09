import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { db, clubs, events, reservations, eq, and } from '@playroom/db'
import { getCurrentUserByClerkId } from '@/lib/current-user'
import ClubProfile from './ClubProfile'

export default async function ClubProfilePage({
  params,
}: {
  params: { locale: string; id: string }
}) {
  const { userId } = await auth()

  const club = await db.query.clubs.findFirst({
    where: eq(clubs.id, Number(params.id)),
  })
  if (!club) redirect(`/${params.locale}/clubs`)

  // clubs stores coordinates in jsonb 'location' — extract for the client component
  const loc = club.location as { lat?: number; lng?: number } | null
  const clubData = {
    id:          club.id,
    name:        club.name,
    description: club.description,
    address:     club.address ?? null,
    lat:         loc?.lat ?? null,
    lng:         loc?.lng ?? null,
    // amenities is jsonb (unknown) — cast to string[] for the client component
    amenities:   club.amenities as string[] | null,
    verified:    club.verified,
  }

  // Get upcoming events for this club
  const clubEvents = await db.query.events.findMany({
    where: eq(events.clubId, Number(params.id)),
    orderBy: (e, { asc }) => [asc(e.startsAt)],
    limit: 5,
  })

  // Check if user has an accepted reservation for any club event
  let hasAcceptedReservation = false
  if (userId) {
    const currentUser = await getCurrentUserByClerkId(userId)
    if (currentUser) {
      for (const evt of clubEvents) {
        const res = await db.query.reservations.findFirst({
          where: and(
            eq(reservations.eventId, evt.id),
            eq(reservations.userId, currentUser.id),
            eq(reservations.status, 'accepted'),
          ),
        })
        if (res) { hasAcceptedReservation = true; break }
      }
    }
  }

  // Pick only the fields ClubProfile needs (avoids jsonb type mismatches)
  const eventsForClient = clubEvents.map(e => ({
    id:         e.id,
    title:      e.title,
    startsAt:   e.startsAt,
    capacity:   e.capacity,
    ticketed:   e.ticketed,
    priceCents: e.priceCents,
  }))

  return (
    <ClubProfile
      club={clubData}
      events={eventsForClient}
      hasAcceptedReservation={hasAcceptedReservation}
      locale={params.locale}
    />
  )
}
