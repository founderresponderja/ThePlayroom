import { NextResponse } from 'next/server'
import { db } from '@playroom/db'
import { sql } from 'drizzle-orm'
import { isAdmin } from '@/lib/admin'
import { deleteObject } from '@/lib/r2'

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const admin = await isAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const body = await req.json()
    const moderationStatus = body?.moderationStatus

    if (!moderationStatus || !['approved', 'rejected'].includes(moderationStatus)) {
      return NextResponse.json({ error: 'Invalid moderationStatus' }, { status: 400 })
    }

    const photoId = Number(params.id)
    const photoResult = await (db as any).execute(sql`select url from photos where id = ${photoId} limit 1`)
    const photo = photoResult?.[0] as { url?: string } | undefined

    await (db as any).execute(sql`update photos set moderation_status = ${moderationStatus} where id = ${photoId}`)

    if (moderationStatus === 'rejected' && photo?.url) {
      await deleteObject(photo.url)
    }

    return NextResponse.json({ ok: true, moderationStatus })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
