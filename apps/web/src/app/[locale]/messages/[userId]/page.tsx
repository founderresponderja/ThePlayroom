import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { db, eq } from '@playroom/db'
import { sql } from 'drizzle-orm'
import { getCurrentUserByClerkId } from '@/lib/current-user'
import MessageThread from './MessageThread'

export default async function MessagePage({
  params,
}: {
  params: { locale: string; userId: string }
}) {
  const { userId: clerkId } = await auth()
  if (!clerkId) redirect(`/${params.locale}/sign-in`)

  const currentUser = await getCurrentUserByClerkId(clerkId)
  if (!currentUser) redirect(`/${params.locale}/sign-in`)

  const otherUserResult = await (db as any).execute(sql`
    select id, display_name as "displayName"
    from users
    where id = ${Number(params.userId)}
    limit 1
  `)
  const otherUser = otherUserResult?.[0] as { id: number; displayName: string | null } | undefined
  if (!otherUser) redirect(`/${params.locale}/matches`)

  return (
    <MessageThread
      currentUserId={currentUser.id}
      currentClerkId={clerkId}
      otherUserId={otherUser.id}
      otherDisplayName={otherUser.displayName ?? 'Anónimo'}
      otherPublicKey={null}
    />
  )
}
