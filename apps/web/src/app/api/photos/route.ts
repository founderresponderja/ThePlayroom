import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { db, photos, eq } from '@playroom/db'
import { deleteObject } from '@/lib/r2'
import { confirmPhotoUpload, deletePhotoRecordForUser, getAuthenticatedPhotoUser } from './_shared'
import { applyRateLimit } from '@/lib/rate-limit-middleware'

// GET — list the authenticated user's photos
export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const authResult = await getAuthenticatedPhotoUser()
  if ('error' in authResult) return authResult.error

  const user = authResult.user

  const userPhotos = await db.query.photos.findMany({
    where: eq(photos.userId, user.id),
    orderBy: (p, { desc }) => [desc(p.createdAt)],
  })

  return NextResponse.json(userPhotos)
}

// POST — save photo record after the client has uploaded directly to R2
export async function POST(req: Request) {
  const authResult = await getAuthenticatedPhotoUser()
  if ('error' in authResult) return authResult.error

  const rateLimit = applyRateLimit(authResult.user.id, 'PHOTO_UPLOAD')
  if (!rateLimit.allowed) {
    return rateLimit.response ?? NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
  }

  return confirmPhotoUpload(req)
}

// DELETE — remove photo from R2 and the database
export async function DELETE(req: Request) {
  const authResult = await getAuthenticatedPhotoUser()
  if ('error' in authResult) return authResult.error

  const rateLimit = applyRateLimit(authResult.user.id, 'PHOTO_DELETE')
  if (!rateLimit.allowed) {
    return rateLimit.response ?? NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
  }

  // photoId is a serial integer — accept it as number from the JSON body
  const { photoId } = (await req.json()) as { photoId: number }

  if (!Number.isInteger(photoId) || photoId <= 0) {
    return NextResponse.json({ error: 'Invalid photo ID' }, { status: 400 })
  }

  try {
    const photo = await deletePhotoRecordForUser(authResult.user, photoId)
    await deleteObject(photo.url)
  } catch (error) {
    if (error instanceof Error && 'status' in error && typeof (error as { status?: unknown }).status === 'number') {
      return NextResponse.json({ error: error.message }, { status: (error as { status: number }).status })
    }

    console.error('[Photos] Failed to delete photo', { photoId, error })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
