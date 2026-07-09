import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { db, threads, matches, eq, and, or } from '@playroom/db'
import { getCurrentUserByClerkId } from '@/lib/current-user'

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const currentUser = await getCurrentUserByClerkId(userId)
  if (!currentUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  // otherUserId is users.id (serial integer)
  const { otherUserId } = (await req.json()) as { otherUserId: number }

  // Verify a mutual match exists between the two users
  const mutualMatch = await db.query.matches.findFirst({
    where: and(
      or(
        and(eq(matches.userAId, currentUser.id), eq(matches.userBId, otherUserId)),
        and(eq(matches.userAId, otherUserId), eq(matches.userBId, currentUser.id)),
      ),
      eq(matches.status, 'matched'),
    ),
  })
  if (!mutualMatch) return NextResponse.json({ error: 'No mutual match' }, { status: 403 })

  // Return existing thread if one already exists
  const existingThread = await db.query.threads.findFirst({
    where: or(
      and(eq(threads.participantAId, currentUser.id), eq(threads.participantBId, otherUserId)),
      and(eq(threads.participantAId, otherUserId), eq(threads.participantBId, currentUser.id)),
    ),
  })
  if (existingThread) return NextResponse.json(existingThread)

  // Create a new thread
  const result = await db
    .insert(threads)
    .values({
      participantAId: currentUser.id,
      participantBId: otherUserId,
    })
    .returning()

  return NextResponse.json(result[0] ?? null)
}
