import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { db, quizResults, users, eq } from '@playroom/db'

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { answers, accountTypeAtTime } = (await req.json()) as {
    answers: Record<string, { rating: string; intensity?: number; role?: string }>
    accountTypeAtTime: string
  }

  const tags: string[] = []
  for (const [key, val] of Object.entries(answers)) {
    if (val.rating === 'yes') tags.push(key)
    if (val.rating === 'maybe') tags.push(`curious:${key}`)
  }

  const yesCount = Object.values(answers).filter(a => a.rating === 'yes').length
  const ratio = yesCount / Math.max(Object.keys(answers).length, 1)
  const archetype =
    ratio > 0.7 ? 'The Adventurer' :
    ratio > 0.4 ? 'The Explorer' :
    ratio > 0.2 ? 'The Curious' :
                  'The Selective'

  const user = await db.query.users.findFirst({ where: eq(users.clerkUserId, userId) })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  await db.insert(quizResults).values({
    userId: user.id,
    quizVersion: '1.0',
    accountTypeAtTime,
    answers,
    derivedTags: tags,
    archetype,
  })

  return NextResponse.json({ derivedTags: tags, archetype })
}
