import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { getPresignedUploadUrl } from '@/lib/r2'
import { randomUUID } from 'crypto'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_SIZE_MB = 10

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { contentType, sizeMb } = (await req.json()) as {
    contentType: string
    sizeMb: number
  }

  if (!ALLOWED_TYPES.includes(contentType)) {
    return NextResponse.json({ error: 'Tipo de ficheiro não permitido.' }, { status: 400 })
  }

  if (sizeMb > MAX_SIZE_MB) {
    return NextResponse.json({ error: `Máximo ${MAX_SIZE_MB}MB.` }, { status: 400 })
  }

  const ext = contentType.split('/')[1] ?? 'jpg'
  const key = `photos/${userId}/${randomUUID()}.${ext}`
  const uploadUrl = await getPresignedUploadUrl(key, contentType)

  return NextResponse.json({ uploadUrl, key })
}
