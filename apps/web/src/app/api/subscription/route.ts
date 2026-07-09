import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { db, subscriptions, eq } from '@playroom/db'
import { getCurrentUserByClerkId } from '@/lib/current-user'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await getCurrentUserByClerkId(userId)
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const sub = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.userId, user.id),
  })

  return NextResponse.json({
    isVip:            user.isVip ?? false,
    plan:             sub?.plan ?? null,
    status:           sub?.status ?? null,
    currentPeriodEnd: sub?.currentPeriodEnd ?? null,
    accountType:      user.accountType,
  })
}
