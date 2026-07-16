import { NextRequest, NextResponse } from 'next/server'
import { db, events, gte } from '@playroom/db'
import { createEventSchema } from '@playroom/config'
import { getValidClerkSession } from '@/lib/auth'
import { ensureCurrentUserByClerkId } from '@/lib/current-user'
import { withDbRetry } from '@/lib/db-observability'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest) {
  const upcoming = await withDbRetry('events.listUpcoming', () =>
    db.query.events.findMany({
      // startsAt is timestamp({ mode: 'string' }) — compare with ISO string
      where: gte(events.startsAt, new Date().toISOString()),
      orderBy: (e, { asc }) => [asc(e.startsAt)],
      limit: 20,
    })
  )
  return NextResponse.json(upcoming)
}

export async function POST(req: NextRequest) {
  const { userId } = await getValidClerkSession(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await ensureCurrentUserByClerkId(userId)
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const normalized = {
    ...body,
    locationMode: body?.locationMode === 'club' ? 'venue' : body?.locationMode,
    privacy: body?.privacy === 'inviteOnly' ? 'invite_only' : body?.privacy,
    customLocation:
      body?.customLocation ??
      ((body?.customLat != null || body?.customLng != null)
        ? { lat: body?.customLat, lng: body?.customLng }
        : undefined),
  }

  const parsed = createEventSchema.safeParse(normalized)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const payload = parsed.data

  const locationMode = payload.locationMode === 'venue' ? 'club' : 'custom'
  const privacy = payload.privacy === 'invite_only' ? 'inviteOnly' : payload.privacy
  const customLocation =
    payload.customLocation || body?.customAddress != null
      ? {
          lat: payload.customLocation?.lat ?? null,
          lng: payload.customLocation?.lng ?? null,
          address: body?.customAddress ?? null,
        }
      : null

  const [event] = await withDbRetry('events.insert', () =>
    db
      .insert(events)
      .values({
        creatorType: user.accountType === 'SWING_CLUB' ? 'club' : 'user',
        creatorId: user.id,
        clubId: body?.clubId ?? null,
        title: payload.title,
        // description is notNull with default '' — pass undefined (not null) to use DB default
        description: payload.description,
        startsAt: payload.startsAt,
        endsAt: payload.endsAt ?? null,
        locationMode,
        // events schema stores coordinates in jsonb 'customLocation' (no separate lat/lng/address cols)
        customLocation,
        capacity: payload.capacity ?? null,
        privacy,
        ticketed: payload.ticketed,
        priceCents: payload.priceCents,
      })
      .returning()
  )

  return NextResponse.json(event)
}
