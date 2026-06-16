import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { db, clubs, users, eq } from '@playroom/db'

export async function GET() {
  // clubs has no createdAt — order by id desc
  const allClubs = await db.query.clubs.findMany({
    where: eq(clubs.verified, true),
    orderBy: (c, { desc }) => [desc(c.id)],
  })
  return NextResponse.json(allClubs)
}

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await db.query.users.findFirst({
    where: eq(users.clerkUserId, userId),
  })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })
  if (user.accountType !== 'SWING_CLUB') {
    return NextResponse.json({ error: 'Only SWING_CLUB accounts can create clubs' }, { status: 403 })
  }

  const { name, description, address, lat, lng, amenities } = (await req.json()) as {
    name: string
    description?: string
    address?: string
    lat?: number
    lng?: number
    amenities?: string[]
  }

  if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })

  const [club] = await db
    .insert(clubs)
    .values({
      ownerUserId: user.id,
      name,
      // description is notNull with default '' — pass undefined (not null) to use DB default
      description: description,
      address:     address ?? null,
      // clubs schema stores coordinates inside the jsonb 'location' column (no separate lat/lng)
      location:    lat != null && lng != null ? { lat, lng } : null,
      amenities:   amenities ?? [],
      verified:    false,
    })
    .returning()

  return NextResponse.json(club)
}
