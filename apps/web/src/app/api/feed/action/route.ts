import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { db, matches, eq, and } from '@playroom/db'
import { notifyUser } from '@/lib/notifications'
import { ensureCurrentUserByClerkId } from '@/lib/current-user'

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const currentUser = await ensureCurrentUserByClerkId(userId)
  if (!currentUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  // targetUserId is an integer (references users.id which is serial)
  const { targetUserId, action } = (await req.json()) as {
    targetUserId: number
    action: 'like' | 'pass'
  }

  if (!targetUserId || !['like', 'pass'].includes(action)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  await db
    .insert(matches)
    .values({
      userAId: currentUser.id,
      userBId: targetUserId,
      algo: 'random',
      status: action === 'like' ? 'pending' : 'rejected',
    })
    .onConflictDoNothing()

  let isMutualMatch = false

  if (action === 'like') {
    const theyLikedUs = await db.query.matches.findFirst({
      where: and(
        eq(matches.userAId, targetUserId),
        eq(matches.userBId, currentUser.id),
        eq(matches.status, 'pending'),
      ),
    })

    if (theyLikedUs) {
      await db
        .update(matches)
        .set({ status: 'matched' })
        .where(and(eq(matches.userAId, currentUser.id), eq(matches.userBId, targetUserId)))

      await db
        .update(matches)
        .set({ status: 'matched' })
        .where(and(eq(matches.userAId, targetUserId), eq(matches.userBId, currentUser.id)))

      isMutualMatch = true

      await notifyUser(Number(targetUserId), {
        title: '🍍 Novo match!',
        body: `Tens um novo match no The Playroom`,
        url: '/pt/matches',
      })
    }
  }

  return NextResponse.json({ success: true, isMutualMatch })
}
