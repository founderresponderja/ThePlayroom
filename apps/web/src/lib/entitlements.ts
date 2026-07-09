import { db, users, entitlements, eq, and } from '@playroom/db'
import { sql } from 'drizzle-orm'

export type Feature =
  | 'ai_matching'
  | 'unlimited_matches'
  | 'unlimited_messages'
  | 'private_photos'
  | 'reservation_priority'
  | 'advanced_filters'
  | 'see_likes'
  | 'reservation_management'

const VIP_FEATURES: Feature[] = [
  'ai_matching',
  'unlimited_matches',
  'unlimited_messages',
  'private_photos',
  'reservation_priority',
  'advanced_filters',
  'see_likes',
]

const BUSINESS_FEATURES: Feature[] = ['reservation_management']

export async function hasFeature(userId: number, feature: Feature): Promise<boolean> {
  const userResult = await (db as any).execute(sql`
    select id, is_vip as "isVip"
    from users
    where id = ${userId}
    limit 1
  `)
  const user = userResult?.[0] as { id: number; isVip: boolean | null } | undefined
  if (!user) return false

  // VIP features — gated by isVip flag (synced by Stripe webhook)
  if (VIP_FEATURES.includes(feature)) {
    return user.isVip ?? false
  }

  // Business features — gated by entitlements table (manual or Stripe-granted)
  if (BUSINESS_FEATURES.includes(feature)) {
    const entitlement = await db.query.entitlements.findFirst({
      where: and(
        eq(entitlements.userId, userId),
        eq(entitlements.feature, feature),
        eq(entitlements.active, true),
      ),
    })
    return !!entitlement
  }

  return false
}

export async function getUserLimits(userId: number) {
  const userResult = await (db as any).execute(sql`
    select id, is_vip as "isVip"
    from users
    where id = ${userId}
    limit 1
  `)
  const user = userResult?.[0] as { id: number; isVip: boolean | null } | undefined
  const isVip = user?.isVip ?? false

  return {
    isVip,
    dailyMatches:           isVip ? Infinity : 5,
    dailyMessages:          isVip ? Infinity : 10,
    canSeeWhoLiked:         isVip,
    canUseAiMatching:       isVip,
    hasReservationPriority: isVip,
    canViewPrivatePhotos:   isVip,
  }
}
