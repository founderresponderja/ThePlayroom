import { NextRequest, NextResponse } from 'next/server'
import { db, users, matches, photos, moderationStatusEnum, eq, and, or } from '@playroom/db'
import { getValidClerkSession } from '@/lib/auth'
import { sql } from 'drizzle-orm'
import { ensureCurrentUserByClerkId } from '@/lib/current-user'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { userId } = await getValidClerkSession(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const currentUser = await ensureCurrentUserByClerkId(userId)
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

      const otherUserResult = await (db as any).execute(sql`
        select
          id,
          display_name as "displayName",
          account_type as "accountType",
          verification_level as "verificationLevel"
        from users
        where id = ${otherUserId}
        limit 1
      `)
      const otherUser = otherUserResult?.[0] as {
        id: number
        displayName: string | null
        accountType: string | null
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
