import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { db, users, eq } from '@playroom/db'
import MessageThread from './MessageThread'

export default async function MessagePage({
  params,
}: {
  params: { locale: string; userId: string }
}) {
  const { userId: clerkId } = await auth()
  if (!clerkId) redirect(`/${params.locale}/sign-in`)

  const currentUser = await db.query.users.findFirst({
    where: eq(users.clerkUserId, clerkId),
  })
  if (!currentUser) redirect(`/${params.locale}/sign-in`)

  const otherUser = await db.query.users.findFirst({
    where: eq(users.id, Number(params.userId)),
  })
  if (!otherUser) redirect(`/${params.locale}/matches`)

  return (
    <MessageThread
      currentUserId={currentUser.id}
      currentClerkId={clerkId}
      otherUserId={otherUser.id}
      otherDisplayName={otherUser.displayName ?? 'Anónimo'}
      otherPublicKey={otherUser.publicKey ?? null}
    />
  )
}
