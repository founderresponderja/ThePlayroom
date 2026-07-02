import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { db, quizResults } from '@playroom/db'
import { sql } from 'drizzle-orm'

function deriveTags(answers: Record<string, { rating: string; intensity?: number; role?: string }>) {
  const tags: string[] = []
  Object.entries(answers).forEach(([key, val]) => {
    if (val.rating === 'yes') tags.push(key)
    if (val.rating === 'maybe') tags.push(`curious:${key}`)
  })
  return tags
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

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { answers, accountTypeAtTime } = await req.json()

    const derivedTags = deriveTags(answers)
    const archetype = deriveArchetype(answers, accountTypeAtTime)

    const userResult = await (db as any).execute(sql`select * from users where clerk_user_id = ${userId} limit 1`)
    const user = userResult?.[0] as { id: number } | undefined
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    await db.insert(quizResults).values({
      userId: user.id,
      quizVersion: '1.0',
      accountTypeAtTime,
      answers,
      derivedTags,
      archetype,
    })

    return NextResponse.json({ derivedTags, archetype })
  } catch (error) {
    console.error('Error saving quiz results:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
