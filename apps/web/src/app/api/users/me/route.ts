import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { db, users } from '@playroom/db'
import { sql } from 'drizzle-orm'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const userResult = await (db as any).execute(sql`select * from users where clerk_user_id = ${userId} limit 1`)
    const user = userResult?.[0] as { id: number; [key: string]: any } | undefined

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const userResult = await (db as any).execute(sql`select * from users where clerk_user_id = ${userId} limit 1`)
    const user = userResult?.[0] as { id: number } | undefined

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const updated = await (db as any).execute(sql`update users set display_name = ${body.displayName ?? ''} where id = ${user.id} returning *`)

    return NextResponse.json(updated?.[0] ?? null)
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
