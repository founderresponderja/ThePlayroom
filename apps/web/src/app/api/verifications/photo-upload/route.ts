import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { getPresignedUploadUrl } from '@/lib/r2'
import { randomUUID } from 'crypto'

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { contentType } = await req.json() as { contentType: string }

  const allowed = ['image/jpeg', 'image/png', 'image/webp']
  if (!allowed.includes(contentType)) {
    return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })
  }

  const ext = contentType.split('/')[1] ?? 'jpg'
  const key = `verifications/${userId}/${randomUUID()}.${ext}`
  const uploadUrl = await getPresignedUploadUrl(key, contentType)

  return NextResponse.json({ uploadUrl, key })
}
