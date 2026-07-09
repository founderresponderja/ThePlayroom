import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { db, photos, users, eq, and } from '@playroom/db'
import { getCurrentUserByClerkId } from '@/lib/current-user'

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await getCurrentUserByClerkId(userId)
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const photoId = Number(params.id)
  if (isNaN(photoId)) return NextResponse.json({ error: 'Invalid photo ID' }, { status: 400 })

  const photo = await db.query.photos.findFirst({
    where: and(eq(photos.id, photoId), eq(photos.userId, user.id)),
  })
  if (!photo) return NextResponse.json({ error: 'Foto não encontrada' }, { status: 404 })

  const body = (await req.json()) as { isPrimary?: boolean; isPrivate?: boolean }

  // If promoting to primary, demote all others first
  if (body.isPrimary === true) {
    await db.update(photos).set({ isPrimary: false }).where(eq(photos.userId, user.id))
  }

  // Build a strict partial update object (avoids spreading false | {...} union in strict mode)
  const setValues: { isPrimary?: boolean; isPrivate?: boolean } = {}
  if (body.isPrimary !== undefined) setValues.isPrimary = body.isPrimary
  if (body.isPrivate !== undefined) setValues.isPrivate = body.isPrivate

  if (Object.keys(setValues).length === 0) {
    return NextResponse.json(photo) // nothing to update
  }

  const updated = await db
    .update(photos)
    .set(setValues)
    .where(and(eq(photos.id, photoId), eq(photos.userId, user.id)))
    .returning()

  return NextResponse.json(updated[0] ?? null)
}
