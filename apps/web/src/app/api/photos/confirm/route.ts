import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { db, photos, users, eq } from '@playroom/db'
import { getPublicUrl, deleteObject } from '@/lib/r2'
import { scanImageForCSAM, reportCSAM } from '@/lib/csam'

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await db.query.users.findFirst({
    where: eq(users.clerkUserId, userId),
  })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const { key, isPrivate, isPrimary } = (await req.json()) as {
    key: string
    isPrivate?: boolean
    isPrimary?: boolean
  }

  const imageUrl = getPublicUrl(key)

  let imageBuffer: ArrayBuffer
  try {
    const imageRes = await fetch(imageUrl)
    if (!imageRes.ok) throw new Error('Failed to fetch uploaded image')
    imageBuffer = await imageRes.arrayBuffer()
  } catch {
    await deleteObject(key).catch(console.error)
    return NextResponse.json(
      { error: 'Nao foi possivel verificar a imagem. Tenta novamente.' },
      { status: 400 },
    )
  }

  const scanResult = await scanImageForCSAM(imageBuffer, key)

  if (!scanResult.safe) {
    await deleteObject(key).catch(console.error)
    await reportCSAM(key, userId, scanResult.reason ?? 'Scanner flagged image')

    console.error(`[CSAM] Blocked upload from user ${userId}, key: ${key}`)

    return NextResponse.json(
      { error: 'Esta imagem nao pode ser aceite. A tua conta foi sinalizada.' },
      { status: 451 },
    )
  }

  const existing = await db.query.photos.findMany({
    where: eq(photos.userId, user.id),
  })

  if (existing.length >= 10) {
    await deleteObject(key).catch(console.error)
    return NextResponse.json({ error: 'Maximo de 10 fotos atingido.' }, { status: 400 })
  }

  if (isPrimary) {
    await db.update(photos).set({ isPrimary: false }).where(eq(photos.userId, user.id))
  }

  const url = getPublicUrl(key)
  const [photo] = await db
    .insert(photos)
    .values({
      userId: user.id,
      url,
      isPrivate: isPrivate ?? false,
      isPrimary: isPrimary ?? existing.length === 0,
      moderationStatus: 'pending',
      csamScanStatus: 'clean',
    })
    .returning()

  return NextResponse.json(photo ?? null)
}
