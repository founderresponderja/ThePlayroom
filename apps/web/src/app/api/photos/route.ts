import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { db, photos, users, eq, and } from '@playroom/db'
import { getPublicUrl, deleteObject } from '@/lib/r2'

// GET — list the authenticated user's photos
export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await db.query.users.findFirst({ where: eq(users.clerkUserId, userId) })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const userPhotos = await db.query.photos.findMany({
    where: eq(photos.userId, user.id),
    orderBy: (p, { desc }) => [desc(p.createdAt)],
  })

  return NextResponse.json(userPhotos)
}

// POST — save photo record after the client has uploaded directly to R2
export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await db.query.users.findFirst({ where: eq(users.clerkUserId, userId) })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const { key, isPrivate, isPrimary } = (await req.json()) as {
    key: string
    isPrivate?: boolean
    isPrimary?: boolean
  }

  // Max 10 photos per user
  const existing = await db.query.photos.findMany({ where: eq(photos.userId, user.id) })
  if (existing.length >= 10) {
    return NextResponse.json({ error: 'Máximo de 10 fotos atingido.' }, { status: 400 })
  }

  // If setting as primary, unset others first
  if (isPrimary) {
    await db.update(photos).set({ isPrimary: false }).where(eq(photos.userId, user.id))
  }

  const url = getPublicUrl(key)
  // First photo is primary by default; createdAt defaults via schema (.defaultNow())
  const inserted = await db
    .insert(photos)
    .values({
      userId: user.id,
      url,
      isPrivate: isPrivate ?? false,
      isPrimary: isPrimary ?? existing.length === 0,
      moderationStatus: 'pending',
      csamScanStatus: 'pending',
    })
    .returning()

  return NextResponse.json(inserted[0] ?? null)
}

// DELETE — remove photo from R2 and the database
export async function DELETE(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await db.query.users.findFirst({ where: eq(users.clerkUserId, userId) })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  // photoId is a serial integer — accept it as number from the JSON body
  const { photoId } = (await req.json()) as { photoId: number }

  const photo = await db.query.photos.findFirst({
    where: and(eq(photos.id, photoId), eq(photos.userId, user.id)),
  })
  if (!photo) return NextResponse.json({ error: 'Foto não encontrada' }, { status: 404 })

  // Extract the R2 object key from the stored public URL
  const key = photo.url.replace(`${process.env.NEXT_PUBLIC_MEDIA_CDN_URL}/`, '')
  await deleteObject(key)

  await db.delete(photos).where(and(eq(photos.id, photoId), eq(photos.userId, user.id)))

  return NextResponse.json({ success: true })
}
