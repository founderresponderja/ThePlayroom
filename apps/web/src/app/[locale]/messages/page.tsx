import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { db, users, threads, photos, eq, and, or } from '@playroom/db'
import ConversationsList from './ConversationsList'

export default async function MessagesPage({ params }: { params: { locale: string } }) {
  const { userId } = await auth()
  if (!userId) redirect(`/${params.locale}/sign-in`)

  const currentUser = await db.query.users.findFirst({
    where: eq(users.clerkUserId, userId),
  })
  if (!currentUser) redirect(`/${params.locale}/sign-in`)

  // Get all threads this user is a participant in
  const userThreads = await db.query.threads.findMany({
    where: or(
      eq(threads.participantAId, currentUser.id),
      eq(threads.participantBId, currentUser.id),
    ),
  })

  // Enrich each thread with the other user's details and primary photo
  const conversations = await Promise.all(
    userThreads.map(async thread => {
      const otherUserId =
        thread.participantAId === currentUser.id ? thread.participantBId : thread.participantAId

      const otherUser = await db.query.users.findFirst({
        where: eq(users.id, otherUserId),
      })

      const primaryPhoto = await db.query.photos.findFirst({
        where: and(
          eq(photos.userId, otherUserId),
          eq(photos.isPrimary, true),
          eq(photos.isPrivate, false),
        ),
      })

      return {
        threadId: thread.id,
        otherUser: {
          id: otherUserId,
          displayName: otherUser?.displayName ?? 'Anónimo',
          primaryPhoto: primaryPhoto?.url ?? null,
          verificationLevel: otherUser?.verificationLevel ?? 'none',
        },
      }
    }),
  )

  return <ConversationsList conversations={conversations} locale={params.locale} />
}
