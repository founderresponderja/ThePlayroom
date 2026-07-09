import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { and, db, eq, moderationStatusEnum, photos, sql, users } from '@playroom/db'
import { z } from 'zod'
import { getObjectBytes, getObjectKey, getPublicUrl, deleteObject } from '@/lib/r2'
import { reportCSAM, scanImageForCSAM } from '@/lib/csam'

const MAX_PHOTOS = 10

const confirmPhotoSchema = z.object({
  key: z.string().min(1),
  isPrivate: z.boolean().optional(),
  isPrimary: z.boolean().optional(),
})

type AuthenticatedPhotoUser = {
  id: number
  clerkUserId: string
}

class PhotoApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message)
  }
}

export async function getAuthenticatedPhotoUser() {
  const { userId } = await auth()
  if (!userId) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }

  const user = await db.query.users.findFirst({
    where: eq(users.clerkUserId, userId),
    columns: { id: true, clerkUserId: true },
  })

  if (!user) return { error: NextResponse.json({ error: 'User not found' }, { status: 404 }) }

  return { user }
}

function assertKeyBelongsToUser(key: string, clerkUserId: string) {
  if (!key.startsWith(`photos/${clerkUserId}/`)) {
    throw new PhotoApiError('Invalid photo key.', 400)
  }
}

async function insertConfirmedPhoto(user: AuthenticatedPhotoUser, body: z.infer<typeof confirmPhotoSchema>) {
  const key = getObjectKey(body.key)
  const url = getPublicUrl(key)

  return db.transaction(async (tx) => {
    await tx.execute(sql`select id from users where id = ${user.id} for update`)

    const existingPhoto = await tx.query.photos.findFirst({
      where: and(eq(photos.userId, user.id), eq(photos.url, url)),
    })
    if (existingPhoto) return existingPhoto

    const existingPhotos = await tx.query.photos.findMany({
      where: eq(photos.userId, user.id),
      columns: { id: true, isPrimary: true },
    })

    if (existingPhotos.length >= MAX_PHOTOS) {
      throw new PhotoApiError(`Máximo de ${MAX_PHOTOS} fotos atingido.`, 400)
    }

    const shouldBePrimary = body.isPrimary ?? existingPhotos.length === 0

    if (shouldBePrimary) {
      await tx.update(photos).set({ isPrimary: false }).where(eq(photos.userId, user.id))
    }

    const inserted = await tx
      .insert(photos)
      .values({
        userId: user.id,
        url,
        isPrivate: body.isPrivate ?? false,
        isPrimary: shouldBePrimary,
        moderationStatus: moderationStatusEnum.enumValues[0],
        csamScanStatus: 'clean',
      })
      .returning()

    return inserted[0]
  })
}

export async function confirmPhotoUpload(req: Request) {
  const authResult = await getAuthenticatedPhotoUser()
  if ('error' in authResult) return authResult.error

  let body: z.infer<typeof confirmPhotoSchema>
  try {
    const payload = await req.json()
    const parsed = confirmPhotoSchema.safeParse(payload)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid photo payload.' }, { status: 400 })
    }
    body = parsed.data
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const user = authResult.user

  try {
    assertKeyBelongsToUser(body.key, user.clerkUserId)

    const imageBuffer = await getObjectBytes(body.key)
    const scanResult = await scanImageForCSAM(imageBuffer, body.key)

    if (!scanResult.safe) {
      await deleteObject(body.key)
      await reportCSAM(body.key, user.clerkUserId, scanResult.reason ?? 'Scanner flagged image')

      return NextResponse.json(
        { error: 'Esta imagem nao pode ser aceite. A tua conta foi sinalizada.' },
        { status: 451 },
      )
    }

    const photo = await insertConfirmedPhoto(user, body)
    return NextResponse.json(photo)
  } catch (error) {
    if (error instanceof PhotoApiError) {
      if (error.status >= 400 && error.status < 500) {
        await deleteObject(body.key)
      }

      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    await deleteObject(body.key).catch(console.error)
    console.error('[Photos] Failed to confirm upload', {
      clerkUserId: user.clerkUserId,
      key: body.key,
      error,
    })

    return NextResponse.json(
      { error: 'Nao foi possivel validar e guardar a imagem. Tenta novamente.' },
      { status: 500 },
    )
  }
}

export async function deletePhotoRecordForUser(user: AuthenticatedPhotoUser, photoId: number) {
  return db.transaction(async (tx) => {
    const photo = await tx.query.photos.findFirst({
      where: and(eq(photos.id, photoId), eq(photos.userId, user.id)),
    })

    if (!photo) throw new PhotoApiError('Foto não encontrada', 404)

    await tx.delete(photos).where(and(eq(photos.id, photoId), eq(photos.userId, user.id)))

    if (photo.isPrimary) {
      const replacement = await tx.query.photos.findFirst({
        where: eq(photos.userId, user.id),
        orderBy: (table, { desc }) => [desc(table.createdAt)],
      })

      if (replacement) {
        await tx.update(photos).set({ isPrimary: true }).where(eq(photos.id, replacement.id))
      }
    }

    return photo
  })
}