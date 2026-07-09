import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { db, events, reservations, users, clubs, eq, and } from '@playroom/db'
import EventDetail from './EventDetail'

export default async function EventDetailPage({
  params,
}: {
  params: { locale: string; id: string }
}) {
  const { userId } = await auth()

  let currentUser = null
  let userReservation = null

  if (userId) {
    currentUser = await db.query.users.findFirst({
      where: eq(users.clerkUserId, userId),
    })
    if (currentUser) {
      userReservation = await db.query.reservations.findFirst({
        where: and(
          eq(reservations.eventId, Number(params.id)),
          eq(reservations.userId, currentUser.id),
        ),
      })
    }
  }

  const event = await db.query.events.findFirst({
    where: eq(events.id, Number(params.id)),
  })
  if (!event) redirect(`/${params.locale}/events`)

  // Get club info if linked
  let clubData: { id: number; name: string; address: string | null; lat: number | null; lng: number | null } | null = null
  if (event.clubId) {
    const club = await db.query.clubs.findFirst({
      where: eq(clubs.id, event.clubId),
    })
    if (club) {
      // clubs stores coordinates in jsonb 'location' — extract for the client component
      const loc = club.location as { lat?: number; lng?: number } | null
      clubData = {
        id:      club.id,
        name:    club.name,
        address: club.address ?? null,
        lat:     loc?.lat ?? null,
        lng:     loc?.lng ?? null,
      }
    }
  }

  // Reveal exact location only after host acceptance writes locationRevealedAt
  const locationRevealed = Boolean(userReservation?.locationRevealedAt)

  // events stores custom coordinates/address in jsonb 'customLocation'
  // Extract customAddress for the client component
  const customLoc = event.customLocation as { address?: string } | null
  const eventForClient = {
    id:           event.id,
    title:        event.title,
    description:  event.description,
    startsAt:     event.startsAt,
    endsAt:       event.endsAt,
    capacity:     event.capacity,
    privacy:      event.privacy,
    ticketed:     event.ticketed,
    priceCents:   event.priceCents,
    locationMode: event.locationMode,
    // Only surface customAddress if location has been revealed
    customAddress: locationRevealed ? (customLoc?.address ?? null) : null,
  }

  return (
    <EventDetail
      event={eventForClient}
      club={clubData}
      userReservation={
        userReservation
          ? {
              id:                 userReservation.id,
              status:             userReservation.status,
              locationRevealedAt: userReservation.locationRevealedAt,
            }
          : null
      }
      locationRevealed={locationRevealed}
      isVip={currentUser?.isVip ?? false}
      isLoggedIn={!!currentUser}
      isCreator={event.creatorId === (currentUser?.id ?? -1)}
      locale={params.locale}
    />
  )
}
