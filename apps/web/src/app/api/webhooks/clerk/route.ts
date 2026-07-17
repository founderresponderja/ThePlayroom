import { Webhook } from 'svix'
import { headers } from 'next/headers'
import * as Sentry from '@sentry/nextjs'
import { db, users, eq } from '@playroom/db'

const DEFAULT_ACCOUNT_TYPE = 'MALE_SINGLE' as const
const SYSTEM_DELETER = 'clerk:webhook'

type AccountType =
  | 'FEMALE_SINGLE'
  | 'MALE_SINGLE'
  | 'COUPLE_MF'
  | 'COUPLE_MM'
  | 'COUPLE_FF'
  | 'SWING_CLUB'
  | 'SEX_SHOP'

type ClerkEmailAddress = {
  id?: string
  email_address?: string
}

type ClerkUserPayload = {
  id: string
  first_name?: string | null
  last_name?: string | null
  username?: string | null
  primary_email_address_id?: string | null
  email_addresses?: ClerkEmailAddress[]
  public_metadata?: Record<string, unknown> | null
  unsafe_metadata?: Record<string, unknown> | null
}

type ClerkWebhookEvent = {
  type: 'user.created' | 'user.updated' | 'user.deleted' | string
  data: ClerkUserPayload
}

const ACCOUNT_TYPES: AccountType[] = [
  'FEMALE_SINGLE',
  'MALE_SINGLE',
  'COUPLE_MF',
  'COUPLE_MM',
  'COUPLE_FF',
  'SWING_CLUB',
  'SEX_SHOP',
]

function truncate(value: string, maxLength: number) {
  return value.slice(0, maxLength)
}

function isAccountType(value: unknown): value is AccountType {
  return typeof value === 'string' && ACCOUNT_TYPES.includes(value as AccountType)
}

function getPrimaryEmail(payload: ClerkUserPayload) {
  const emails = payload.email_addresses ?? []
  const primary = emails.find((email) => email.id === payload.primary_email_address_id)
  return primary?.email_address ?? emails[0]?.email_address ?? null
}

function getAccountType(payload: ClerkUserPayload) {
  const publicAccountType = payload.public_metadata?.accountType
  if (isAccountType(publicAccountType)) return publicAccountType

  const unsafeAccountType = payload.unsafe_metadata?.accountType
  if (isAccountType(unsafeAccountType)) return unsafeAccountType

  return null
}

function getDisplayName(payload: ClerkUserPayload) {
  const fullName = [payload.first_name, payload.last_name]
    .filter((part): part is string => typeof part === 'string' && part.trim().length > 0)
    .join(' ')
    .trim()

  if (fullName) return truncate(fullName, 100)
  if (payload.username?.trim()) return truncate(payload.username.trim(), 100)

  const email = getPrimaryEmail(payload)
  if (email) return truncate(email.split('@')[0] || email, 100)

  return 'New User'
}

async function syncCreatedUser(payload: ClerkUserPayload) {
  const now = new Date().toISOString()

  await db
    .insert(users)
    .values({
      clerkUserId: payload.id,
      accountType: getAccountType(payload) ?? DEFAULT_ACCOUNT_TYPE,
      displayName: getDisplayName(payload),
      onboardingComplete: false,
      verificationLevel: 'none',
      subscriptionTier: 'free',
      isVip: false,
      updatedAt: now,
      deletedAt: null,
      deletedBy: null,
    })
    .onConflictDoUpdate({
      target: users.clerkUserId,
      set: {
        displayName: getDisplayName(payload),
        accountType: getAccountType(payload) ?? DEFAULT_ACCOUNT_TYPE,
        updatedAt: now,
        deletedAt: null,
        deletedBy: null,
      },
    })
}

async function syncUpdatedUser(payload: ClerkUserPayload) {
  const now = new Date().toISOString()
  const accountType = getAccountType(payload)

  const updated = await db
    .update(users)
    .set({
      displayName: getDisplayName(payload),
      ...(accountType ? { accountType } : {}),
      updatedAt: now,
    })
    .where(eq(users.clerkUserId, payload.id))
    .returning({ id: users.id })

  if (updated.length > 0) return

  await db
    .insert(users)
    .values({
      clerkUserId: payload.id,
      accountType: accountType ?? DEFAULT_ACCOUNT_TYPE,
      displayName: getDisplayName(payload),
      onboardingComplete: false,
      verificationLevel: 'none',
      subscriptionTier: 'free',
      isVip: false,
      updatedAt: now,
    })
    .onConflictDoNothing({ target: users.clerkUserId })
}

async function syncDeletedUser(payload: ClerkUserPayload) {
  await db
    .update(users)
    .set({
      deletedAt: new Date().toISOString(),
      deletedBy: SYSTEM_DELETER,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(users.clerkUserId, payload.id))
}

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SIGNING_SECRET
  if (!WEBHOOK_SECRET) {
    return new Response('Missing webhook secret', { status: 500 })
  }

  const headerPayload = headers()
  const svix_id = headerPayload.get('svix-id')
  const svix_timestamp = headerPayload.get('svix-timestamp')
  const svix_signature = headerPayload.get('svix-signature')

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Missing svix headers', { status: 400 })
  }

  const payload = await req.text()
  const wh = new Webhook(WEBHOOK_SECRET)

  let evt: ClerkWebhookEvent
  try {
    evt = wh.verify(payload, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as ClerkWebhookEvent
  } catch (err) {
    Sentry.withScope((scope) => {
      scope.setLevel('warning')
      scope.setTag('webhook.provider', 'clerk')
      scope.setTag('webhook.stage', 'signature_verification')
      Sentry.captureException(err)
    })
    return new Response('Invalid signature', { status: 400 })
  }

  try {
    switch (evt.type) {
      case 'user.created':
        await syncCreatedUser(evt.data)
        break
      case 'user.updated':
        await syncUpdatedUser(evt.data)
        break
      case 'user.deleted':
        await syncDeletedUser(evt.data)
        break
      default:
        break
    }
  } catch (error) {
    console.error('[Clerk Webhook] Failed to sync user', {
      type: evt.type,
      clerkUserId: evt.data?.id,
      error,
    })
    Sentry.withScope((scope) => {
      scope.setLevel('error')
      scope.setTag('webhook.provider', 'clerk')
      scope.setTag('webhook.stage', 'user_sync')
      scope.setTag('webhook.event_type', evt.type)
      scope.setUser({ id: evt.data?.id })
      Sentry.captureException(error)
    })
    return new Response('Failed to sync Clerk user', { status: 500 })
  }

  console.log('[Clerk Webhook]', evt.type, evt.data.id)

  return new Response('OK', { status: 200 })
}

