import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db, pushSubscriptions, eq, and } from '@playroom/db'
import { getValidClerkSession } from '@/lib/auth'
import { getCurrentUserByClerkId } from '@/lib/current-user'

const webPushPayloadSchema = z.object({
  endpoint: z.string().min(1),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
})

const expoPushPayloadSchema = z.union([
  z.object({
    token: z.string().regex(/^ExponentPushToken\[[^\]]+\]$/),
    platform: z.literal('expo'),
  }),
  z.object({
    token: z.string().regex(/^ExponentPushToken\[[^\]]+\]$/),
  }),
])

const subscribePayloadSchema = z.union([webPushPayloadSchema, expoPushPayloadSchema])

const unsubscribePayloadSchema = z.union([
  z.object({ endpoint: z.string().min(1) }),
  z.object({ token: z.string().regex(/^ExponentPushToken\[[^\]]+\]$/) }),
])

export async function POST(req: NextRequest) {
  const { userId } = await getValidClerkSession(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await getCurrentUserByClerkId(userId)
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const parsedPayload = subscribePayloadSchema.safeParse(await req.json())
  if (!parsedPayload.success) {
    return NextResponse.json({ error: 'Invalid push payload' }, { status: 400 })
  }

  const payload = parsedPayload.data
  const isExpo = 'token' in payload
  const endpoint = isExpo ? payload.token : payload.endpoint

  const existing = await db.query.pushSubscriptions.findFirst({
    where: and(
      eq(pushSubscriptions.userId, user.id),
      eq(pushSubscriptions.endpoint, endpoint),
    ),
  })

  if (existing) {
    await db.update(pushSubscriptions)
      .set({
        platform: isExpo ? 'expo' : 'web',
        p256dh: isExpo ? null : payload.keys.p256dh,
        auth: isExpo ? null : payload.keys.auth,
      })
      .where(and(
        eq(pushSubscriptions.userId, user.id),
        eq(pushSubscriptions.endpoint, endpoint),
      ))
  } else {
    await db.insert(pushSubscriptions).values({
      userId: user.id,
      platform: isExpo ? 'expo' : 'web',
      endpoint,
      p256dh: isExpo ? null : payload.keys.p256dh,
      auth: isExpo ? null : payload.keys.auth,
    })
  }

  return NextResponse.json({ success: true })
}

export async function DELETE(req: NextRequest) {
  const { userId } = await getValidClerkSession(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await getCurrentUserByClerkId(userId)
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const parsedPayload = unsubscribePayloadSchema.safeParse(await req.json())
  if (!parsedPayload.success) {
    return NextResponse.json({ error: 'Invalid unsubscribe payload' }, { status: 400 })
  }

  const endpoint = 'token' in parsedPayload.data
    ? parsedPayload.data.token
    : parsedPayload.data.endpoint

  await db.delete(pushSubscriptions)
    .where(and(
      eq(pushSubscriptions.userId, user.id),
      eq(pushSubscriptions.endpoint, endpoint),
    ))

  return NextResponse.json({ success: true })
}