import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { db, events, reservations, users, eq, and } from '@playroom/db'
import ManageEventClient from './ManageEventClient'

export default async function ManageEventPage({
  params,
}: {
  params: { locale: string; id: string }
}) {
  const eventId = Number(params.id)
  if (!Number.isInteger(eventId) || eventId <= 0) {
    redirect(`/${params.locale}/events`)
  }

  const { userId } = await auth()
  if (!userId) redirect(`/${params.locale}/sign-in`)

  const currentUser = await db.query.users.findFirst({
    where: eq(users.clerkUserId, userId),
  })
  if (!currentUser) redirect(`/${params.locale}/sign-in`)

  const event = await db.query.events.findFirst({
    where: eq(events.id, eventId),
  })
  if (!event) redirect(`/${params.locale}/events`)

  // Host-only access: only event creator can manage reservations.
  if (event.creatorId !== currentUser.id) {
    redirect(`/${params.locale}/events/${event.id}`)
  }

  const pendingReservations = await db.query.reservations.findMany({
    where: and(
      eq(reservations.eventId, event.id),
      eq(reservations.status, 'requested'),
    ),
    orderBy: (r, { desc, asc }) => [desc(r.priorityScore), asc(r.id)],
  })

  const pendingWithUsers = await Promise.all(
    pendingReservations.map(async (reservation) => {
      const participant = await db.query.users.findFirst({
        where: eq(users.id, reservation.userId),
      })

      return {
        id: reservation.id,
        userId: reservation.userId,
        status: reservation.status,
        priorityScore: reservation.priorityScore,
        displayName: participant?.displayName ?? `Utilizador #${reservation.userId}`,
      }
    }),
  )

  return (
    <ManageEventClient
      locale={params.locale}
      event={{ id: event.id, title: event.title }}
      pendingReservations={pendingWithUsers}
    />
  )
}
