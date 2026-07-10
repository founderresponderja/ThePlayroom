import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { db, clubs, eq } from '@playroom/db'
import { z } from 'zod'
import { ensureCurrentUserByClerkId } from '@/lib/current-user'
import { withDbRetry } from '@/lib/db-observability'

const createClubSchema = z.object({
  name: z.string().trim().min(2).max(200),
  description: z.string().trim().max(4000).optional(),
  address: z.string().trim().max(500).optional(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  amenities: z.array(z.string().trim().min(1).max(100)).max(50).optional(),
})

export async function GET() {
  // clubs has no createdAt — order by id desc
  const allClubs = await withDbRetry('clubs.listVerified', () =>
    db.query.clubs.findMany({
      where: eq(clubs.verified, true),
      orderBy: (c, { desc }) => [desc(c.id)],
    })
  )
  return NextResponse.json(allClubs)
}

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await ensureCurrentUserByClerkId(userId)
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })
  if (user.accountType !== 'SWING_CLUB') {
    return NextResponse.json({ error: 'Only SWING_CLUB accounts can create clubs' }, { status: 403 })
  }

  let payload: z.infer<typeof createClubSchema>
  try {
    const parsed = createClubSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Invalid club payload',
          details: parsed.error.issues.map((issue) => ({
            path: issue.path.join('.'),
            message: issue.message,
          })),
        },
        { status: 400 },
      )
    }

    payload = parsed.data
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if ((payload.lat == null) !== (payload.lng == null)) {
    return NextResponse.json({ error: 'lat and lng must be provided together' }, { status: 400 })
  }

  const [club] = await withDbRetry('clubs.insert', () =>
    db
      .insert(clubs)
      .values({
        ownerUserId: user.id,
        name: payload.name,
        // description is notNull with default '' — pass undefined (not null) to use DB default
        description: payload.description,
        address: payload.address ?? null,
        // clubs schema stores coordinates inside the jsonb 'location' column (no separate lat/lng)
        location: payload.lat != null && payload.lng != null ? { lat: payload.lat, lng: payload.lng } : null,
        amenities: payload.amenities ?? [],
        verified: false,
      })
      .returning()
  )

  return NextResponse.json(club)
}
