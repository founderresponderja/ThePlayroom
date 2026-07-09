import { NextRequest, NextResponse } from 'next/server'
import { db, users, threads, messages, eq, and, or } from '@playroom/db'
import { z } from 'zod'
import { getValidClerkSession } from '@/lib/auth'
import { getCurrentUserByClerkId } from '@/lib/current-user'

const sendMessageSchema = z.object({
  threadId: z.number().int().positive(),
  encryptedPayload: z.string().min(1),
})

export async function GET(req: NextRequest) {
  const { userId } = await getValidClerkSession(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const currentUser = await getCurrentUserByClerkId(userId)
  if (!currentUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const { searchParams } = new URL(req.url)
  const threadIdParam = searchParams.get('threadId')
  if (!threadIdParam) return NextResponse.json({ error: 'Missing threadId' }, { status: 400 })

  // threads.id is integer (serial) — parse from query string
  const threadId = Number(threadIdParam)
  if (isNaN(threadId)) return NextResponse.json({ error: 'Invalid threadId' }, { status: 400 })

  const thread = await db.query.threads.findFirst({
    where: eq(threads.id, threadId),
  })
  if (!thread) return NextResponse.json({ error: 'Thread not found' }, { status: 404 })

  const isParticipant =
    thread.participantAId === currentUser.id || thread.participantBId === currentUser.id
  if (!isParticipant) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const threadMessages = await db.query.messages.findMany({
    where: eq(messages.threadId, threadId),
    orderBy: (m, { asc }) => [asc(m.createdAt)],
    limit: 50,
  })

  return NextResponse.json(threadMessages)
}

export async function POST(req: NextRequest) {
  const { userId } = await getValidClerkSession(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const currentUser = await getCurrentUserByClerkId(userId)
  if (!currentUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  let payload: z.infer<typeof sendMessageSchema>
  try {
    const parsed = sendMessageSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid message payload' }, { status: 400 })
    }
    payload = parsed.data
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const thread = await db.query.threads.findFirst({
    where: eq(threads.id, payload.threadId),
  })
  if (!thread) return NextResponse.json({ error: 'Thread not found' }, { status: 404 })

  const isParticipant =
    thread.participantAId === currentUser.id || thread.participantBId === currentUser.id
  if (!isParticipant) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const result = await db
    .insert(messages)
    .values({
      threadId: payload.threadId,
      senderId: currentUser.id,
      encryptedPayload: payload.encryptedPayload,
    })
    .returning()

  return NextResponse.json(result[0] ?? null)
}
