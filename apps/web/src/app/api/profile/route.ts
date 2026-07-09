import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { db, profiles, eq } from '@playroom/db'
import { sql } from 'drizzle-orm'

export async function PATCH(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userResult = await (db as any).execute(sql`
    select id
    from users
    where clerk_user_id = ${userId}
    limit 1
  `)
  const user = userResult?.[0] as { id: number } | undefined
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const body = (await req.json()) as {
    bio?: string
    interests?: string[]
    approxLocation?: { city?: string } | null
  }
  const approxLocation = normalizeApproxLocation(body.approxLocation)

  const existing = await db.query.profiles.findFirst({
    where: eq(profiles.userId, user.id),
  })

  if (existing) {
    // profiles has no updatedAt column — omit it
    const updated = await db
      .update(profiles)
      .set({
        bio: body.bio ?? existing.bio,
        interests: body.interests ?? existing.interests,
        approxLocation: approxLocation ?? existing.approxLocation,
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
        bio: body.bio ?? '',
        interests: body.interests ?? [],
        approxLocation,
      })
      .returning()

    return NextResponse.json(created[0] ?? null)
  }
}

function normalizeApproxLocation(value?: { city?: string } | null) {
  if (value === undefined) return undefined

  const city = value?.city?.trim()
  return city ? { city } : null
}
