import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { db, threads, photos, moderationStatusEnum, eq, and, or } from '@playroom/db'
import { sql } from 'drizzle-orm'
import { getCurrentUserByClerkId } from '@/lib/current-user'
import ConversationsList from './ConversationsList'

export default async function MessagesPage({ params }: { params: { locale: string } }) {
  const { userId } = await auth()
  if (!userId) redirect(`/${params.locale}/sign-in`)

  const currentUser = await getCurrentUserByClerkId(userId)
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

      const otherUserResult = await (db as any).execute(sql`
        select
          id,
          display_name as "displayName",
          verification_level as "verificationLevel"
        from users
        where id = ${otherUserId}
        limit 1
      `)
      const otherUser = otherUserResult?.[0] as {
        id: number
        displayName: string | null
        verificationLevel: string | null
      } | undefined

      const primaryPhoto = await db.query.photos.findFirst({
        where: and(
          eq(photos.userId, otherUserId),
          eq(photos.isPrimary, true),
          eq(photos.isPrivate, false),
          eq(photos.moderationStatus, moderationStatusEnum.enumValues[1]),
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
