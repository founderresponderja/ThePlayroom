import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { db, eq, photos } from '@playroom/db'
import { getPresignedUploadUrl } from '@/lib/r2'
import { randomUUID } from 'crypto'
import { z } from 'zod'
import { getCurrentUserByClerkId } from '@/lib/current-user'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_SIZE_MB = 10
const MAX_PHOTOS = 10

const uploadUrlSchema = z.object({
  contentType: z.string(),
  sizeMb: z.number().positive(),
})

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await getCurrentUserByClerkId(userId)
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  let body: z.infer<typeof uploadUrlSchema>
  try {
    const parsed = uploadUrlSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid upload request.' }, { status: 400 })
    }
    body = parsed.data
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const existingPhotos = await db.query.photos.findMany({
    where: eq(photos.userId, user.id),
    columns: { id: true },
  })

  if (existingPhotos.length >= MAX_PHOTOS) {
    return NextResponse.json({ error: `Máximo de ${MAX_PHOTOS} fotos atingido.` }, { status: 400 })
  }

  if (!ALLOWED_TYPES.includes(body.contentType)) {
    return NextResponse.json({ error: 'Tipo de ficheiro não permitido.' }, { status: 400 })
  }

  if (body.sizeMb > MAX_SIZE_MB) {
    return NextResponse.json({ error: `Máximo ${MAX_SIZE_MB}MB.` }, { status: 400 })
  }

  const ext = body.contentType.split('/')[1] ?? 'jpg'
  const key = `photos/${userId}/${randomUUID()}.${ext}`
  const uploadUrl = await getPresignedUploadUrl(key, body.contentType)

  return NextResponse.json({ uploadUrl, key })
}
