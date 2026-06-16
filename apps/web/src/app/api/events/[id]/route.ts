import { NextResponse } from 'next/server'
import { db, events, eq } from '@playroom/db'

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const event = await db.query.events.findFirst({
    where: eq(events.id, Number(params.id)),
  })
  if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 })

  // Return event with customLocation nulled — exact coordinates are
  // only revealed after the host accepts the reservation
  return NextResponse.json({
    ...event,
    customLocation: null,
  })
}
