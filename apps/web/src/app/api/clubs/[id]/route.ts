import { NextResponse } from 'next/server'
import { db, clubs, eq } from '@playroom/db'

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const club = await db.query.clubs.findFirst({
    where: eq(clubs.id, Number(params.id)),
  })
  if (!club) return NextResponse.json({ error: 'Club not found' }, { status: 404 })

  // clubs stores coordinates in jsonb 'location' — fuzz to 1 decimal place before returning
  const loc = club.location as { lat?: number; lng?: number } | null
  return NextResponse.json({
    ...club,
    location: loc
      ? {
          lat: loc.lat != null ? Math.round(loc.lat * 10) / 10 : null,
          lng: loc.lng != null ? Math.round(loc.lng * 10) / 10 : null,
        }
      : null,
  })
}
