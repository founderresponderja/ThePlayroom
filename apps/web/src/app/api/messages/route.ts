import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { db, users, threads, messages, eq, and, or } from '@playroom/db'

export async function GET(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const currentUser = await db.query.users.findFirst({
    where: eq(users.clerkUserId, userId),
  })
  if (!currentUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const { searchParams } = new URL(req.url)
  const threadIdParam = searchParams.get('threadId')
  if (!threadIdParam) return NextResponse.json({ error: 'Missing threadId' }, { status: 400 })

  // threads.id is integer (serial) — parse from query string
  const threadId = Number(threadIdParam)
  if (isNaN(threadId)) return NextResponse.json({ error: 'Invalid threadId' }, { status: 400 })

  // Verify user is a participant
  const thread = await db.query.threads.findFirst({
    where: and(
      eq(threads.id, threadId),
      or(
        eq(threads.participantAId, currentUser.id),
        eq(threads.participantBId, currentUser.id),
      ),
    ),
  })
  if (!thread) return NextResponse.json({ error: 'Thread not found' }, { status: 404 })

  const threadMessages = await db.query.messages.findMany({
    where: eq(messages.threadId, threadId),
    orderBy: (m, { asc }) => [asc(m.createdAt)],
    limit: 50,
  })

  return NextResponse.json(threadMessages)
}

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const currentUser = await db.query.users.findFirst({
    where: eq(users.clerkUserId, userId),
  })
  if (!currentUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  // threadId is integer (serial FK) — typed accordingly
  const { threadId, encryptedPayload } = (await req.json()) as {
    threadId: number
    encryptedPayload: string
  }

  if (!threadId || !encryptedPayload) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  // Verify user is a participant
  const thread = await db.query.threads.findFirst({
    where: and(
      eq(threads.id, threadId),
      or(
        eq(threads.participantAId, currentUser.id),
        eq(threads.participantBId, currentUser.id),
      ),
    ),
  })
  if (!thread) return NextResponse.json({ error: 'Thread not found' }, { status: 404 })

  const result = await db
    .insert(messages)
    .values({
      threadId,
      senderId: currentUser.id,
      encryptedPayload,
    })
    .returning()

  return NextResponse.json(result[0] ?? null)
}
