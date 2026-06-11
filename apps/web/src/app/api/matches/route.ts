import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { db, users, matches, photos, eq, and, or } from '@playroom/db'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const currentUser = await db.query.users.findFirst({
    where: eq(users.clerkUserId, userId),
  })
  if (!currentUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const mutualMatches = await db.query.matches.findMany({
    where: and(
      or(
        eq(matches.userAId, currentUser.id),
        eq(matches.userBId, currentUser.id),
      ),
      eq(matches.status, 'matched'),
    ),
  })

  const matchDetails = await Promise.all(
    mutualMatches.map(async match => {
      const otherUserId = match.userAId === currentUser.id ? match.userBId : match.userAId

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
        matchId: match.id,
        matchedAt: match.createdAt, // now exists after schema update
        user: {
          id: otherUserId,
          displayName: otherUser?.displayName ?? null,
          accountType: otherUser?.accountType ?? null,
          verificationLevel: otherUser?.verificationLevel ?? null,
          primaryPhoto: primaryPhoto?.url ?? null,
        },
      }
    }),
  )

  return NextResponse.json(matchDetails)
}
