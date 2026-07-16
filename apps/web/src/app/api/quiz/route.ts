import { NextResponse, type NextRequest } from 'next/server'
import { db, profiles, quizResults, eq, desc, sql } from '@playroom/db'
import { calculateCompatibility } from '@/lib/matching'
import { generateCouplePublicProfile } from '@/lib/ai-couple-profile'
import { getValidClerkSession } from '@/lib/auth'
import { ensureCurrentUserByClerkId } from '@/lib/current-user'
import { withDbRetry } from '@/lib/db-observability'

let ensuredQuizSchemaCompatibility = false

async function ensureQuizSchemaCompatibility() {
  if (ensuredQuizSchemaCompatibility) return

  await withDbRetry('quiz.ensureSchemaCompatibility', () =>
    db.execute(sql`
      do $$
      begin
        if exists (
          select 1
          from information_schema.columns
          where table_schema = 'public'
            and table_name = 'quiz_results'
            and column_name = 'derived_tags'
            and data_type = 'ARRAY'
        ) then
          alter table quiz_results
          alter column derived_tags type jsonb
          using to_jsonb(derived_tags);
        end if;

        if exists (
          select 1
          from information_schema.columns
          where table_schema = 'public'
            and table_name = 'quiz_results'
            and column_name = 'answers'
            and data_type = 'ARRAY'
        ) then
          alter table quiz_results
          alter column answers type jsonb
          using to_jsonb(answers);
        end if;
      end
      $$;
    `)
  )

  ensuredQuizSchemaCompatibility = true
}

function getErrorMeta(error: unknown) {
  const candidate = error as { code?: string; message?: string; detail?: string; constraint?: string } | null
  return {
    code: candidate?.code ?? null,
    message: candidate?.message ?? (error instanceof Error ? error.message : 'Unknown error'),
    detail: candidate?.detail ?? null,
    constraint: candidate?.constraint ?? null,
  }
}

function deriveTags(answers: Record<string, { rating: string; intensity?: number; role?: string }>) {
  const tags: string[] = []
  Object.entries(answers).forEach(([key, val]) => {
    if (val.rating === 'yes') tags.push(key)
    if (val.rating === 'maybe') tags.push(`curious:${key}`)
  })
  return tags
}

function deriveYesTags(answers: Record<string, { rating: string }>) {
  return Object.entries(answers)
    .filter(([, val]) => val.rating === 'yes')
    .map(([key]) => key)
}

function deriveArchetype(
  answers: Record<string, { rating: string }>,
  accountType: string
): string {
  const yesCount = Object.values(answers).filter(a => a.rating === 'yes').length
  const total = Object.keys(answers).length
  const ratio = yesCount / total

  if (ratio > 0.7) return 'The Adventurer'
  if (ratio > 0.4) return 'The Explorer'
  if (ratio > 0.2) return 'The Curious'
  return 'The Selective'
}

function intersectTags(a: string[], b: string[]) {
  const setB = new Set(b)
  return a.filter((tag) => setB.has(tag))
}

function normalizeObject(value: unknown) {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
}

export async function GET(req: NextRequest) {
  const { userId } = await getValidClerkSession(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await ensureCurrentUserByClerkId(userId)
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const latestQuiz = await withDbRetry('quiz.getLatestByUser', () =>
    db.query.quizResults.findFirst({
      where: eq(quizResults.userId, user.id),
      orderBy: (q) => [desc(q.createdAt)],
    })
  )

  const rawAnswers = normalizeObject(latestQuiz?.answers)
  const memberAnswers = normalizeObject(rawAnswers.memberAnswers)
  const coupleMembersCompleted = [memberAnswers.member1, memberAnswers.member2].filter(Boolean).length

  return NextResponse.json({
    completed: Boolean(latestQuiz),
    accountTypeAtTime: latestQuiz?.accountTypeAtTime ?? null,
    coupleMembersCompleted,
    createdAt: latestQuiz?.createdAt ?? null,
  })
}

export async function POST(req: NextRequest) {
  const { userId } = await getValidClerkSession(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    await ensureQuizSchemaCompatibility()
    const { answers, memberAnswers, accountTypeAtTime } = await req.json()

    const user = await ensureCurrentUserByClerkId(userId, { accountType: accountTypeAtTime })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const isCoupleAccount = typeof accountTypeAtTime === 'string' && accountTypeAtTime.startsWith('COUPLE_')

    if (isCoupleAccount) {
      const member1 = (memberAnswers?.member1 ?? {}) as Record<string, { rating: string }>
      const member2 = (memberAnswers?.member2 ?? {}) as Record<string, { rating: string }>

      const member1Tags = deriveTags(member1)
      const member2Tags = deriveTags(member2)
      const member1YesTags = deriveYesTags(member1)
      const member2YesTags = deriveYesTags(member2)
      const sharedTags = intersectTags(member1YesTags, member2YesTags)

      const member1Archetype = deriveArchetype(member1, accountTypeAtTime)
      const member2Archetype = deriveArchetype(member2, accountTypeAtTime)
      const compatibility = calculateCompatibility(member1Tags, member2Tags)

      const profile = await withDbRetry('quiz.findProfile', () =>
        db.query.profiles.findFirst({ where: eq(profiles.userId, user.id) })
      )
      const existingPreferences = normalizeObject(profile?.preferences)
      const matchPreferences = normalizeObject(existingPreferences.matchPreferences)
      const members = normalizeObject(matchPreferences.members)

      const member1Prefs = normalizeObject(members.member1)
      const member2Prefs = normalizeObject(members.member2)

      const generatedCoupleProfile = await generateCouplePublicProfile({
        userId: user.id,
        accountType: accountTypeAtTime,
        sharedTags,
        memberOrientations: [
          String(member1Prefs.orientation ?? 'not-set'),
          String(member2Prefs.orientation ?? 'not-set'),
        ],
        memberLookingFor: [
          Array.isArray(member1Prefs.lookingFor) ? (member1Prefs.lookingFor as string[]) : [],
          Array.isArray(member2Prefs.lookingFor) ? (member2Prefs.lookingFor as string[]) : [],
        ],
      })

      await withDbRetry('quiz.insertCoupleResult', () =>
        db.insert(quizResults).values({
          userId: user.id,
          quizVersion: '2.0',
          accountTypeAtTime,
          answers: {
            memberAnswers: {
              member1,
              member2,
            },
            memberArchetypes: {
              member1: member1Archetype,
              member2: member2Archetype,
            },
            coupleCompatibility: {
              score: compatibility.score,
              sharedTags: compatibility.sharedTags,
              incompatible: compatibility.incompatible,
            },
          },
          derivedTags: sharedTags,
          archetype: `${member1Archetype} + ${member2Archetype}`,
        })
      )

      const mergedPreferences = {
        ...existingPreferences,
        couplePrivateCompatibility: {
          score: compatibility.score,
          sharedTags: compatibility.sharedTags,
          incompatible: compatibility.incompatible,
          memberArchetypes: {
            member1: member1Archetype,
            member2: member2Archetype,
          },
          updatedAt: new Date().toISOString(),
        },
        couplePublicProfile: generatedCoupleProfile,
      }

      if (profile) {
        await withDbRetry('quiz.updateProfilePreferences', () =>
          db.update(profiles).set({ preferences: mergedPreferences }).where(eq(profiles.userId, user.id))
        )
      } else {
        await withDbRetry('quiz.insertProfileForResult', () =>
          db.insert(profiles).values({
            userId: user.id,
            bio: '',
            interests: [],
            preferences: mergedPreferences,
          })
        )
      }

      return NextResponse.json({
        derivedTags: sharedTags,
        archetype: `${member1Archetype} + ${member2Archetype}`,
        memberArchetypes: {
          member1: member1Archetype,
          member2: member2Archetype,
        },
        coupleCompatibility: {
          score: compatibility.score,
          sharedTags: compatibility.sharedTags,
          incompatible: compatibility.incompatible,
        },
        couplePublicProfile: generatedCoupleProfile,
        ai: generatedCoupleProfile.aiMeta,
      })
    }

    const normalizedAnswers = (answers ?? {}) as Record<string, { rating: string; intensity?: number; role?: string }>
    const derivedTags = deriveTags(normalizedAnswers)
    const archetype = deriveArchetype(normalizedAnswers, accountTypeAtTime)

    await withDbRetry('quiz.insertSingleResult', () =>
      db.insert(quizResults).values({
        userId: user.id,
        quizVersion: '2.0',
        accountTypeAtTime,
        answers: normalizedAnswers,
        derivedTags,
        archetype,
      })
    )

    return NextResponse.json({ derivedTags, archetype })
  } catch (error) {
    console.error('Error saving quiz results:', error)
    const meta = getErrorMeta(error)

    return NextResponse.json(
      {
        error: 'Failed to save quiz results',
        message: meta.message,
        code: meta.code,
        detail: meta.detail,
        constraint: meta.constraint,
      },
      { status: 500 }
    )
  }
}
