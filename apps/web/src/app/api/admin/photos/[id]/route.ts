import { NextResponse } from 'next/server'
import { and, db, eq, moderationStatusEnum, photos } from '@playroom/db'
import { z } from 'zod'
import { isAdmin } from '@/lib/admin'
import { deleteObject } from '@/lib/r2'

const moderationSchema = z.object({
  moderationStatus: z.enum([
    moderationStatusEnum.enumValues[1],
    moderationStatusEnum.enumValues[2],
  ]),
})

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const admin = await isAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const parsed = moderationSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid moderationStatus' }, { status: 400 })
    }

    const moderationStatus = parsed.data.moderationStatus

    const photoId = Number(params.id)
    if (!Number.isInteger(photoId) || photoId <= 0) {
      return NextResponse.json({ error: 'Invalid photo ID' }, { status: 400 })
    }

    const photo = await db.query.photos.findFirst({
      where: eq(photos.id, photoId),
    })
    if (!photo) {
      return NextResponse.json({ error: 'Photo not found' }, { status: 404 })
    }

    if (moderationStatus === moderationStatusEnum.enumValues[1]) {
      await db.update(photos).set({ moderationStatus }).where(eq(photos.id, photoId))
      return NextResponse.json({ ok: true, moderationStatus })
    }

    await deleteObject(photo.url)
    await db.transaction(async (tx) => {
      await tx.delete(photos).where(and(eq(photos.id, photoId), eq(photos.userId, photo.userId)))

      if (photo.isPrimary) {
        const replacement = await tx.query.photos.findFirst({
          where: eq(photos.userId, photo.userId),
          orderBy: (table, { desc }) => [desc(table.createdAt)],
        })

        if (replacement) {
          await tx.update(photos).set({ isPrimary: true }).where(eq(photos.id, replacement.id))
        }
      }
    })

    return NextResponse.json({ ok: true, moderationStatus })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
