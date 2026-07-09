import { db } from '@playroom/db'
import { sql } from 'drizzle-orm'

export type CurrentUser = {
  id: number
  clerkUserId: string
  accountType: string
  displayName: string
  verificationLevel: string | null
  onboardingComplete: boolean
  subscriptionTier: string | null
  isVip: boolean | null
}

export async function getCurrentUserByClerkId(clerkUserId: string) {
  const rows = await (db as any).execute(sql`
    select
      id,
      clerk_user_id as "clerkUserId",
      account_type as "accountType",
      display_name as "displayName",
      verification_level as "verificationLevel",
      onboarding_complete as "onboardingComplete",
      subscription_tier as "subscriptionTier"
      , is_vip as "isVip"
    from users
    where clerk_user_id = ${clerkUserId}
    limit 1
  `)

  return rows?.[0] as CurrentUser | undefined
}