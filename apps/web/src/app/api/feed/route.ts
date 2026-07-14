import { NextRequest, NextResponse } from 'next/server'
import { db, users, profiles, photos, matches, quizResults, moderationStatusEnum, eq, and, ne, notInArray, isNotNull, sql, gte, desc } from '@playroom/db'
import { getValidClerkSession } from '@/lib/auth'
import { getCurrentUserByClerkId } from '@/lib/current-user'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { userId } = await getValidClerkSession(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const currentUser = await getCurrentUserByClerkId(userId)
  if (!currentUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })
  if (!currentUser.onboardingComplete) return NextResponse.json({ error: 'Onboarding required' }, { status: 403 })

  // Get current user's quiz tags for VIP matching
  const currentUserQuiz = await db.query.quizResults.findFirst({
    where: eq(quizResults.userId, currentUser.id),
    orderBy: (q) => [desc(q.createdAt)],
  })
  const currentUserTags = (currentUserQuiz?.derivedTags as string[] | null) ?? []

  // Enforce daily match limit for free users
  if (!currentUser.isVip) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    // createdAt is timestamp({ mode: 'string' }) — compare with ISO string
    const todayMatches = await db.query.matches.findMany({
      where: and(
        eq(matches.userAId, currentUser.id),
        gte(matches.createdAt, today.toISOString()),
      ),
    })
    if (todayMatches.length >= 5) {
      return NextResponse.json(
        { error: 'Limite diário atingido. Faz upgrade para VIP para matches ilimitados.', limitReached: true },
        { status: 429 },
      )
    }
  }

  const seenMatches = await db.query.matches.findMany({
    where: eq(matches.userAId, currentUser.id),
  })
  const seenIds = seenMatches.map(m => m.userBId)
  const excludeIds = [currentUser.id, ...seenIds]

  const candidates = await db
    .select({
      id: users.id,
      displayName: users.displayName,
      accountType: users.accountType,
      verificationLevel: users.verificationLevel,
      isVip: users.isVip,
      bio: profiles.bio,
      interests: profiles.interests,
      preferences: profiles.preferences,
      // Schema stores location as jsonb object, not separate lat/lng columns
      approxLocation: profiles.approxLocation,
    })
    .from(users)
    .leftJoin(profiles, eq(profiles.userId, users.id))
    .where(
      and(
        notInArray(users.id, excludeIds),
        isNotNull(users.onboardingComplete),
        eq(users.onboardingComplete, true),
        ne(users.id, currentUser.id),
      ),
    )
    .orderBy(sql`RANDOM()`)
    .limit(10)

  const candidatesWithPhotos = await Promise.all(
    candidates.map(async candidate => {
      const primaryPhoto = await db.query.photos.findFirst({
        where: and(
          eq(photos.userId, candidate.id),
          eq(photos.isPrimary, true),
          eq(photos.isPrivate, false),
          eq(photos.moderationStatus, moderationStatusEnum.enumValues[1]),
        ),
      })
      const allPublicPhotos = await db.query.photos.findMany({
        where: and(
          eq(photos.userId, candidate.id),
          eq(photos.isPrivate, false),
          eq(photos.moderationStatus, moderationStatusEnum.enumValues[1]),
        ),
      })
      return {
        ...candidate,
        primaryPhoto: primaryPhoto?.url ?? null,
        photoCount: allPublicPhotos.length,
        photos: allPublicPhotos.map(p => p.url),
      }
    }),
  )

  // VIP users get candidates ranked by compatibility
  let finalCandidates: any[] = candidatesWithPhotos
  if (currentUser.isVip && currentUserTags.length > 0) {
    const candidatesWithTags = await Promise.all(
      candidatesWithPhotos.map(async (candidate) => {
        const quiz = await db.query.quizResults.findFirst({
          where: eq(quizResults.userId, candidate.id),
          orderBy: (q) => [desc(q.createdAt)],
        })
        return {
          ...candidate,
          tags: (quiz?.derivedTags as string[] | null) ?? [],
        }
      })
    )

    // Import rankCandidates from matching lib
    const { rankCandidates } = await import('@/lib/matching')
    const ranked = rankCandidates(
      currentUserTags,
      candidatesWithTags.map(c => ({ id: c.id, tags: c.tags }))
    )

    // Reorder candidates by compatibility score
    const rankedIds = new Map(ranked.map(r => [r.id, r]))
    finalCandidates = candidatesWithTags
      .map(c => ({
        ...c,
        compatibilityScore: rankedIds.get(c.id)?.score ?? 0,
        sharedTags: rankedIds.get(c.id)?.sharedTags ?? [],
      }))
      .sort((a, b) => b.compatibilityScore - a.compatibilityScore)
  } else {
    // Free users: random order (already RANDOM() from DB)
    finalCandidates = candidatesWithPhotos.map(c => ({
      ...c,
      compatibilityScore: null,
      sharedTags: [],
    }))
  }

  finalCandidates = finalCandidates.map((candidate) => {
    const preferences = (candidate.preferences ?? {}) as Record<string, any>
    const couplePublicProfile = preferences.couplePublicProfile as
      | { headline?: string; about?: string; commonCharacteristics?: string[] }
      | undefined

    if (typeof candidate.accountType === 'string' && candidate.accountType.startsWith('COUPLE_') && couplePublicProfile) {
      return {
        ...candidate,
        displayName: couplePublicProfile.headline ?? candidate.displayName,
        bio: couplePublicProfile.about ?? candidate.bio,
        sharedTags:
          Array.isArray(couplePublicProfile.commonCharacteristics) && couplePublicProfile.commonCharacteristics.length > 0
            ? couplePublicProfile.commonCharacteristics
            : candidate.sharedTags,
      }
    }

    return candidate
  })

  return NextResponse.json(finalCandidates)
}
