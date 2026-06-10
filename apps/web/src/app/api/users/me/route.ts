import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { db, users, eq } from '@playroom/db'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await db.query.users.findFirst({
    where: eq(users.clerkUserId, userId),
  })
  return NextResponse.json(user ?? null)
}

export async function PATCH(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body: Record<string, unknown> = await req.json()

  // Whitelist allowed fields only
  const allowed = [
    'accountType',
    'displayName',
    'dateOfBirth',
    'ageVerifiedAt',
    'onboardingComplete',
  ] as const

  const data: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in body) data[key] = body[key]
  }

  // Coerce date strings → Date objects (schema uses mode:'date')
  if (data.dateOfBirth) data.dateOfBirth = new Date(data.dateOfBirth as string)
  if (data.ageVerifiedAt) data.ageVerifiedAt = new Date(data.ageVerifiedAt as string)

  const updated = await db
    .update(users)
    .set({ ...data, updatedAt: new Date().toISOString() })
    .where(eq(users.clerkUserId, userId))
    .returning()

  return NextResponse.json(updated[0] ?? null)
}
