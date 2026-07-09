import { NextRequest, NextResponse } from 'next/server'
import { db, users, matches, photos, moderationStatusEnum, eq, and, or } from '@playroom/db'
import { getValidClerkSession } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const { userId } = await getValidClerkSession(req)
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
          eq(photos.moderationStatus, moderationStatusEnum.enumValues[1]),
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
          publicKey: otherUser?.publicKey ?? null,
          primaryPhoto: primaryPhoto?.url ?? null,
        },
      }
    }),
  )

  return NextResponse.json(matchDetails)
}
