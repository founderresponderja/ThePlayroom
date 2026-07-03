import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { db, users, pushSubscriptions, eq, and } from '@playroom/db'

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await db.query.users.findFirst({
    where: eq(users.clerkUserId, userId),
  })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const { endpoint, keys } = await req.json() as {
    endpoint: string
    keys: { p256dh: string; auth: string }
  }

  const existing = await db.query.pushSubscriptions.findFirst({
    where: and(
      eq(pushSubscriptions.userId, user.id),
      eq(pushSubscriptions.endpoint, endpoint),
    ),
  })

  if (existing) {
    await db.update(pushSubscriptions)
      .set({
        p256dh: keys.p256dh,
        auth: keys.auth,
      })
      .where(eq(pushSubscriptions.endpoint, endpoint))
  } else {
    await db.insert(pushSubscriptions).values({
      userId: user.id,
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
    })
  }

  return NextResponse.json({ success: true })
}

export async function DELETE(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { endpoint } = await req.json() as { endpoint: string }

  await db.delete(pushSubscriptions)
    .where(eq(pushSubscriptions.endpoint, endpoint))

  return NextResponse.json({ success: true })
}