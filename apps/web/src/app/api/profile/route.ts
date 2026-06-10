import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { db, profiles, users, eq } from '@playroom/db'

export async function PATCH(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await db.query.users.findFirst({ where: eq(users.clerkUserId, userId) })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const { bio, interests } = (await req.json()) as {
    bio?: string
    interests?: string[]
  }

  const existing = await db.query.profiles.findFirst({
    where: eq(profiles.userId, user.id),
  })

  if (existing) {
    // profiles has no updatedAt column — omit it
    const updated = await db
      .update(profiles)
      .set({
        bio: bio ?? existing.bio,
        interests: interests ?? existing.interests,
      })
      .where(eq(profiles.userId, user.id))
      .returning()

    return NextResponse.json(updated[0] ?? null)
  } else {
    // bio is text().notNull() — pass empty string fallback, never null
    const created = await db
      .insert(profiles)
      .values({
        userId: user.id,
        bio: bio ?? '',
        interests: interests ?? [],
      })
      .returning()

    return NextResponse.json(created[0] ?? null)
  }
}
