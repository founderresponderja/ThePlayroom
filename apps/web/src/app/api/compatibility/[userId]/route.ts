import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { db, quizResults, eq, desc } from '@playroom/db'
import { calculateCompatibility } from '@/lib/matching'
import { getCurrentUserByClerkId } from '@/lib/current-user'
import { sql } from 'drizzle-orm'

export async function GET(
  _req: Request,
  { params }: { params: { userId: string } }
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const currentUser = await getCurrentUserByClerkId(userId)
  if (!currentUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })
  if (!currentUser.isVip) {
    return NextResponse.json({ error: 'VIP required' }, { status: 403 })
  }

  const otherUserResult = await (db as any).execute(sql`
    select id
    from users
    where id = ${Number(params.userId)}
    limit 1
  `)
  const otherUser = otherUserResult?.[0] as { id: number } | undefined
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
