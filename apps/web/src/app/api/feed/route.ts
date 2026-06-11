import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { db, users, profiles, photos, matches, eq, and, ne, notInArray, isNotNull, sql } from '@playroom/db'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const currentUser = await db.query.users.findFirst({
    where: eq(users.clerkUserId, userId),
  })
  if (!currentUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })
  if (!currentUser.onboardingComplete) return NextResponse.json({ error: 'Onboarding required' }, { status: 403 })

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
        ),
      })
      const allPublicPhotos = await db.query.photos.findMany({
        where: and(
          eq(photos.userId, candidate.id),
          eq(photos.isPrivate, false),
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

  return NextResponse.json(candidatesWithPhotos)
}
