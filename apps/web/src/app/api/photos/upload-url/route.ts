import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { getPresignedUploadUrl } from '@/lib/r2'
import { randomUUID } from 'crypto'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const
const MAX_SIZE_MB = 10

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { contentType, sizeMb } = (await req.json()) as {
    contentType: string
    sizeMb: number
  }

  if (!(ALLOWED_TYPES as readonly string[]).includes(contentType)) {
    return NextResponse.json(
      { error: 'Tipo de ficheiro não permitido. Usa JPEG, PNG ou WebP.' },
      { status: 400 },
    )
  }

  if (sizeMb > MAX_SIZE_MB) {
    return NextResponse.json(
      { error: `Ficheiro demasiado grande. Máximo ${MAX_SIZE_MB}MB.` },
      { status: 400 },
    )
  }

  // noUncheckedIndexedAccess: split('/')[1] is string | undefined — guard it
  const ext = contentType.split('/')[1] ?? 'jpg'
  const key = `photos/${userId}/${randomUUID()}.${ext}`
  const uploadUrl = await getPresignedUploadUrl(key, contentType)

  return NextResponse.json({ uploadUrl, key })
}
