import { accountTypeEnum, db, users, eq } from '@playroom/db'
import { sql } from 'drizzle-orm'
import { withDbRetry } from '@/lib/db-observability'

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

type EnsureCurrentUserSeed = {
  accountType?: string | null
  displayName?: string | null
}

type AccountType = (typeof accountTypeEnum.enumValues)[number]

export const DEFAULT_ACCOUNT_TYPE = 'MALE_SINGLE'

function normalizeAccountType(accountType?: string | null) {
  if (typeof accountType !== 'string') return DEFAULT_ACCOUNT_TYPE
  return accountTypeEnum.enumValues.includes(accountType as (typeof accountTypeEnum.enumValues)[number])
    ? (accountType as AccountType)
    : DEFAULT_ACCOUNT_TYPE
}

function normalizeDisplayName(displayName?: string | null) {
  const trimmed = displayName?.trim()
  return trimmed ? trimmed.slice(0, 100) : 'New User'
}

async function fetchCurrentUserByClerkId(clerkUserId: string) {
  const rows = await withDbRetry<CurrentUser[]>('currentUser.fetchByClerkId', () =>
    (db as any).execute(sql`
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
  )

  return rows?.[0] as CurrentUser | undefined
}

export async function ensureCurrentUserByClerkId(clerkUserId: string, seed: EnsureCurrentUserSeed = {}) {
  const existing = await fetchCurrentUserByClerkId(clerkUserId)
  if (existing) return existing

  const now = new Date().toISOString()
  await withDbRetry('currentUser.insertIfMissing', () =>
    db
      .insert(users)
      .values({
        clerkUserId,
        accountType: normalizeAccountType(seed.accountType),
        displayName: normalizeDisplayName(seed.displayName),
        onboardingComplete: false,
        verificationLevel: 'none',
        subscriptionTier: 'free',
        isVip: false,
        updatedAt: now,
        deletedAt: null,
        deletedBy: null,
      })
      .onConflictDoNothing({ target: users.clerkUserId })
  )

  const inserted = await fetchCurrentUserByClerkId(clerkUserId)
  if (!inserted) return undefined

  const patch: Partial<typeof users.$inferInsert> = {}
  if (seed.accountType && inserted.accountType !== seed.accountType && accountTypeEnum.enumValues.includes(seed.accountType as (typeof accountTypeEnum.enumValues)[number])) {
    patch.accountType = seed.accountType as AccountType
  }
  if (seed.displayName) {
    const normalizedDisplayName = normalizeDisplayName(seed.displayName)
    if (inserted.displayName !== normalizedDisplayName) {
      patch.displayName = normalizedDisplayName
    }
  }

  if (Object.keys(patch).length === 0) {
    return inserted
  }

  const [updated] = await withDbRetry('currentUser.patchSeedFields', () =>
    db
      .update(users)
      .set({ ...patch, updatedAt: now })
      .where(eq(users.id, inserted.id))
      .returning({
        id: users.id,
        clerkUserId: users.clerkUserId,
        accountType: users.accountType,
        displayName: users.displayName,
        verificationLevel: users.verificationLevel,
        onboardingComplete: users.onboardingComplete,
        subscriptionTier: users.subscriptionTier,
        isVip: users.isVip,
      })
  )

  return (updated as CurrentUser | undefined) ?? inserted
}

export async function getCurrentUserByClerkId(clerkUserId: string) {
  return ensureCurrentUserByClerkId(clerkUserId)
}