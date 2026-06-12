import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { db, users, eq } from '@playroom/db'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await db.query.users.findFirst({
    where: eq(users.clerkUserId, userId),
  })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  return NextResponse.json({ publicKey: user.publicKey ?? null })
}

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { publicKey } = (await req.json()) as { publicKey: string }
  if (!publicKey) return NextResponse.json({ error: 'Missing publicKey' }, { status: 400 })

  // updatedAt is timestamp({ mode: 'string' }) — must pass a string, not a Date object
  await db
    .update(users)
    .set({ publicKey, updatedAt: new Date().toISOString() })
    .where(eq(users.clerkUserId, userId))

  return NextResponse.json({ success: true })
}
