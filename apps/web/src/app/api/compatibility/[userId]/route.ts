import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { db, users, quizResults, eq, desc } from '@playroom/db'
import { calculateCompatibility } from '@/lib/matching'

export async function GET(
  _req: Request,
  { params }: { params: { userId: string } }
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const currentUser = await db.query.users.findFirst({
    where: eq(users.clerkUserId, userId)
  })
  if (!currentUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })
  if (!currentUser.isVip) {
    return NextResponse.json({ error: 'VIP required' }, { status: 403 })
  }

  const otherUser = await db.query.users.findFirst({
    where: eq(users.id, Number(params.userId))
  })
  if (!otherUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const currentQuiz = await db.query.quizResults.findFirst({
    where: eq(quizResults.userId, currentUser.id),
    orderBy: (q) => [desc(q.createdAt)],
  })

  const otherQuiz = await db.query.quizResults.findFirst({
    where: eq(quizResults.userId, otherUser.id),
    orderBy: (q) => [desc(q.createdAt)],
  })

  if (!currentQuiz || !otherQuiz) {
    return NextResponse.json({ score: null, reason: 'Quiz results missing' })
  }

  const result = calculateCompatibility(
    (currentQuiz.derivedTags as string[]) ?? [],
    (otherQuiz.derivedTags as string[]) ?? []
  )

  return NextResponse.json({
    score: result.score,
    sharedTags: result.sharedTags,
    incompatible: result.incompatible,
  })
}
