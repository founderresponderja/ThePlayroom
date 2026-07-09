import { NextRequest, NextResponse } from 'next/server'
import { db, events, users, eq, gte } from '@playroom/db'
import { getValidClerkSession } from '@/lib/auth'

export async function GET(_req: NextRequest) {
  const upcoming = await db.query.events.findMany({
    // startsAt is timestamp({ mode: 'string' }) — compare with ISO string
    where: gte(events.startsAt, new Date().toISOString()),
    orderBy: (e, { asc }) => [asc(e.startsAt)],
    limit: 20,
  })
  return NextResponse.json(upcoming)
}

export async function POST(req: NextRequest) {
  const { userId } = await getValidClerkSession(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await db.query.users.findFirst({
    where: eq(users.clerkUserId, userId),
  })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const {
    title, description, startsAt, endsAt,
    locationMode, clubId, customLat, customLng, customAddress,
    capacity, privacy, ticketed, priceCents,
  } = (await req.json()) as {
    title: string
    description?: string
    startsAt: string
    endsAt?: string
    locationMode: 'club' | 'custom'
    clubId?: number
    customLat?: number
    customLng?: number
    customAddress?: string
    capacity?: number
    privacy?: 'public' | 'private' | 'inviteOnly'
    ticketed?: boolean
    priceCents?: number
  }

  if (!title || !startsAt) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const [event] = await db
    .insert(events)
    .values({
      creatorType: user.accountType === 'SWING_CLUB' ? 'club' : 'user',
      creatorId:   user.id,
      clubId:      clubId ?? null,
      title,
      // description is notNull with default '' — pass undefined (not null) to use DB default
      description: description,
      startsAt,
      endsAt:      endsAt ?? null,
      locationMode: locationMode ?? 'custom',
      // events schema stores coordinates in jsonb 'customLocation' (no separate lat/lng/address cols)
      customLocation: (customLat != null || customLng != null || customAddress != null)
        ? { lat: customLat ?? null, lng: customLng ?? null, address: customAddress ?? null }
        : null,
      capacity:   capacity ?? null,
      privacy:    privacy ?? 'public',
      ticketed:   ticketed ?? false,
      priceCents: priceCents ?? null,
    })
    .returning()

  return NextResponse.json(event)
}
