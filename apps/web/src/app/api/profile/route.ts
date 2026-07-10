import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { db, profiles, quizResults, users, eq, desc } from '@playroom/db'
import { generateCouplePublicProfile } from '@/lib/ai-couple-profile'
import { ensureCurrentUserByClerkId } from '@/lib/current-user'
import { withDbRetry } from '@/lib/db-observability'

export async function PATCH(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await ensureCurrentUserByClerkId(userId)
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const body = (await req.json()) as {
    bio?: string
    interests?: string[]
    approxLocation?: { city?: string } | null
    preferences?: Record<string, unknown>
  }
  const approxLocation = normalizeApproxLocation(body.approxLocation)

  const existing = await withDbRetry('profile.findByUserId', () =>
    db.query.profiles.findFirst({
      where: eq(profiles.userId, user.id),
    })
  )

  if (existing) {
    // profiles has no updatedAt column — omit it
    const mergedPreferences = {
      ...normalizeUnknownObject(existing.preferences),
      ...normalizeObject(body.preferences),
    }

    const updated = await withDbRetry('profile.update', () =>
      db
        .update(profiles)
        .set({
          bio: body.bio ?? existing.bio,
          interests: body.interests ?? existing.interests,
          approxLocation: approxLocation ?? existing.approxLocation,
          preferences: mergedPreferences,
        })
        .where(eq(profiles.userId, user.id))
        .returning()
    )

    const updatedProfile = updated[0] ?? null
    const enrichedProfile = await maybeRefreshCouplePublicProfile(user.id, updatedProfile)
    return NextResponse.json(enrichedProfile)
  } else {
    // bio is text().notNull() — pass empty string fallback, never null
    const created = await withDbRetry('profile.insert', () =>
      db
        .insert(profiles)
        .values({
          userId: user.id,
          bio: body.bio ?? '',
          interests: body.interests ?? [],
          approxLocation,
          preferences: normalizeObject(body.preferences),
        })
        .returning()
    )

    const createdProfile = created[0] ?? null
    const enrichedProfile = await maybeRefreshCouplePublicProfile(user.id, createdProfile)
    return NextResponse.json(enrichedProfile)
  }
}

function normalizeApproxLocation(value?: { city?: string } | null) {
  if (value === undefined) return undefined

  const city = value?.city?.trim()
  return city ? { city } : null
}

function normalizeObject(value?: Record<string, unknown>) {
  if (!value || typeof value !== 'object') return {}
  return value
}

function normalizeUnknownObject(value: unknown) {
  if (!value || typeof value !== 'object') return {}
  return value as Record<string, unknown>
}

async function maybeRefreshCouplePublicProfile(userId: number, profile: any) {
  if (!profile) return profile

  const userResult = await withDbRetry('profile.readUserAccountType', () =>
    db
      .select({ accountType: users.accountType })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)
  )
  const user = userResult[0]

  if (!user?.accountType?.startsWith('COUPLE_')) return profile

  const latestQuiz = await withDbRetry('profile.findLatestQuiz', () =>
    db.query.quizResults.findFirst({
      where: eq(quizResults.userId, userId),
      orderBy: (q) => [desc(q.createdAt)],
    })
  )

  if (!latestQuiz) return profile

  const preferences = normalizeUnknownObject(profile.preferences)
  const matchPreferences = normalizeUnknownObject(preferences.matchPreferences)
  const members = normalizeUnknownObject(matchPreferences.members)
  const member1 = normalizeUnknownObject(members.member1)
  const member2 = normalizeUnknownObject(members.member2)

  const generatedCoupleProfile = await generateCouplePublicProfile({
    accountType: user.accountType,
    sharedTags: Array.isArray(latestQuiz.derivedTags) ? (latestQuiz.derivedTags as string[]) : [],
    memberOrientations: [String(member1.orientation ?? 'not-set'), String(member2.orientation ?? 'not-set')],
    memberLookingFor: [
      Array.isArray(member1.lookingFor) ? (member1.lookingFor as string[]) : [],
      Array.isArray(member2.lookingFor) ? (member2.lookingFor as string[]) : [],
    ],
  })

  const mergedPreferences = {
    ...preferences,
    couplePublicProfile: generatedCoupleProfile,
  }

  const updated = await withDbRetry('profile.refreshCouplePublicProfile', () =>
    db
      .update(profiles)
      .set({ preferences: mergedPreferences })
      .where(eq(profiles.userId, userId))
      .returning()
  )

  return updated[0] ?? profile
}
