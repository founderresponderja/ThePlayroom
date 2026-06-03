import {
  pgTable,
  pgEnum,
  text,
  timestamp,
  boolean,
  integer,
  jsonb,
  real,
  primaryKey,
  uuid,
} from 'drizzle-orm/pg-core'

export const accountTypeEnum = pgEnum('account_type', [
  'FEMALE_SINGLE',
  'MALE_SINGLE',
  'COUPLE_MF',
  'COUPLE_MM',
  'COUPLE_FF',
  'SWING_CLUB',
  'SEX_SHOP',
])

export const verificationLevelEnum = pgEnum('verification_level', [
  'none',
  'photo',
  'video',
  'social',
])

export const subscriptionTierEnum = pgEnum('subscription_tier', [
  'free',
  'vip',
])

export const reservationStatusEnum = pgEnum('reservation_status', [
  'requested',
  'accepted',
  'declined',
  'waitlist',
])

export const moderationStatusEnum = pgEnum('moderation_status', [
  'pending',
  'approved',
  'rejected',
])

export const orderStatusEnum = pgEnum('order_status', [
  'pending',
  'paid',
  'shipped',
  'delivered',
  'refunded',
  'cancelled',
])

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  clerkUserId: text('clerk_user_id').notNull().unique(),
  accountType: accountTypeEnum('account_type'),
  displayName: text('display_name'),
  email: text('email'),
  ageVerifiedAt: timestamp('age_verified_at'),
  dateOfBirth: timestamp('date_of_birth'),
  verificationLevel: verificationLevelEnum('verification_level').default('none'),
  subscriptionTier: subscriptionTierEnum('subscription_tier').default('free'),
  isVip: boolean('is_vip').default(false),
  onboardingComplete: boolean('onboarding_complete').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  deletedAt: timestamp('deleted_at'),
})

export const profiles = pgTable('profiles', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id),
  bio: text('bio'),
  preferences: jsonb('preferences'),
  interests: text('interests').array(),
  boundaries: text('boundaries').array(),
  approxLat: real('approx_lat'),
  approxLng: real('approx_lng'),
  realLat: text('real_lat'),
  realLng: text('real_lng'),
  visibilitySettings: jsonb('visibility_settings'),
  updatedAt: timestamp('updated_at').defaultNow(),
})

export const photos = pgTable('photos', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id),
  url: text('url').notNull(),
  isPrivate: boolean('is_private').default(false),
  isPrimary: boolean('is_primary').default(false),
  moderationStatus: moderationStatusEnum('moderation_status').default('pending'),
  csamScanStatus: text('csam_scan_status').default('pending'),
  createdAt: timestamp('created_at').defaultNow(),
})

export const verifications = pgTable('verifications', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id),
  type: text('type').notNull(),
  status: text('status').default('pending'),
  reviewedBy: uuid('reviewed_by'),
  evidenceRef: text('evidence_ref'),
  reviewedAt: timestamp('reviewed_at'),
  createdAt: timestamp('created_at').defaultNow(),
})

export const quizResults = pgTable('quiz_results', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id),
  quizVersion: text('quiz_version').notNull(),
  accountTypeAtTime: accountTypeEnum('account_type_at_time'),
  answers: jsonb('answers'),
  derivedTags: text('derived_tags').array(),
  archetype: text('archetype'),
  createdAt: timestamp('created_at').defaultNow(),
})

export const clubs = pgTable('clubs', {
  id: uuid('id').defaultRandom().primaryKey(),
  ownerUserId: uuid('owner_user_id').notNull().references(() => users.id),
  name: text('name').notNull(),
  description: text('description'),
  lat: real('lat'),
  lng: real('lng'),
  address: text('address'),
  amenities: text('amenities').array(),
  verified: boolean('verified').default(false),
  createdAt: timestamp('created_at').defaultNow(),
})

export const events = pgTable('events', {
  id: uuid('id').defaultRandom().primaryKey(),
  creatorType: text('creator_type').notNull(),
  creatorId: uuid('creator_id').notNull(),
  clubId: uuid('club_id').references(() => clubs.id),
  title: text('title').notNull(),
  description: text('description'),
  startsAt: timestamp('starts_at').notNull(),
  endsAt: timestamp('ends_at').notNull(),
  locationMode: text('location_mode').default('custom'),
  customLat: real('custom_lat'),
  customLng: real('custom_lng'),
  customAddress: text('custom_address'),
  capacity: integer('capacity'),
  privacy: text('privacy').default('public'),
  ticketed: boolean('ticketed').default(false),
  priceCents: integer('price_cents'),
  createdAt: timestamp('created_at').defaultNow(),
})

export const reservations = pgTable('reservations', {
  id: uuid('id').defaultRandom().primaryKey(),
  eventId: uuid('event_id').notNull().references(() => events.id),
  userId: uuid('user_id').notNull().references(() => users.id),
  status: reservationStatusEnum('status').default('requested'),
  priorityScore: integer('priority_score').default(0),
  paymentIntentId: text('payment_intent_id'),
  locationRevealedAt: timestamp('location_revealed_at'),
  createdAt: timestamp('created_at').defaultNow(),
})

export const matches = pgTable('matches', {
  id: uuid('id').defaultRandom().primaryKey(),
  userAId: uuid('user_a_id').notNull().references(() => users.id),
  userBId: uuid('user_b_id').notNull().references(() => users.id),
  algo: text('algo').default('random'),
  score: real('score'),
  status: text('status').default('pending'),
  createdAt: timestamp('created_at').defaultNow(),
})

export const threads = pgTable('threads', {
  id: uuid('id').defaultRandom().primaryKey(),
  participantAId: uuid('participant_a_id').notNull().references(() => users.id),
  participantBId: uuid('participant_b_id').notNull().references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
})

export const messages = pgTable('messages', {
  id: uuid('id').defaultRandom().primaryKey(),
  threadId: uuid('thread_id').notNull().references(() => threads.id),
  senderId: uuid('sender_id').notNull().references(() => users.id),
  encryptedPayload: text('encrypted_payload').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
})

export const subscriptions = pgTable('subscriptions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id),
  stripeCustomerId: text('stripe_customer_id'),
  stripeSubscriptionId: text('stripe_subscription_id'),
  plan: text('plan'),
  status: text('status'),
  currentPeriodEnd: timestamp('current_period_end'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

export const entitlements = pgTable('entitlements', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id),
  feature: text('feature').notNull(),
  active: boolean('active').default(true),
  source: text('source'),
  updatedAt: timestamp('updated_at').defaultNow(),
})

export const shops = pgTable('shops', {
  id: uuid('id').defaultRandom().primaryKey(),
  ownerUserId: uuid('owner_user_id').notNull().references(() => users.id),
  name: text('name').notNull(),
  description: text('description'),
  logoUrl: text('logo_url'),
  stripeConnectAccountId: text('stripe_connect_account_id'),
  payoutsEnabled: boolean('payouts_enabled').default(false),
  status: text('status').default('pending'),
  verified: boolean('verified').default(false),
  createdAt: timestamp('created_at').defaultNow(),
})

export const products = pgTable('products', {
  id: uuid('id').defaultRandom().primaryKey(),
  shopId: uuid('shop_id').notNull().references(() => shops.id),
  title: text('title').notNull(),
  description: text('description'),
  images: text('images').array(),
  priceCents: integer('price_cents').notNull(),
  currency: text('currency').default('EUR'),
  category: text('category'),
  stock: integer('stock').default(0),
  ageRestricted: boolean('age_restricted').default(true),
  moderationStatus: moderationStatusEnum('moderation_status').default('pending'),
  active: boolean('active').default(false),
  createdAt: timestamp('created_at').defaultNow(),
})

export const orders = pgTable('orders', {
  id: uuid('id').defaultRandom().primaryKey(),
  buyerUserId: uuid('buyer_user_id').notNull().references(() => users.id),
  status: orderStatusEnum('status').default('pending'),
  paymentIntentId: text('payment_intent_id'),
  totalCents: integer('total_cents').notNull(),
  platformFeeCents: integer('platform_fee_cents'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

export const orderItems = pgTable('order_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id').notNull().references(() => orders.id),
  productId: uuid('product_id').notNull().references(() => products.id),
  shopId: uuid('shop_id').notNull().references(() => shops.id),
  qty: integer('qty').notNull(),
  unitPriceCents: integer('unit_price_cents').notNull(),
  feeCents: integer('fee_cents'),
})

export const notifications = pgTable('notifications', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id),
  type: text('type').notNull(),
  title: text('title'),
  body: text('body'),
  read: boolean('read').default(false),
  data: jsonb('data'),
  createdAt: timestamp('created_at').defaultNow(),
})

export const reports = pgTable('reports', {
  id: uuid('id').defaultRandom().primaryKey(),
  reporterUserId: uuid('reporter_user_id').notNull().references(() => users.id),
  targetType: text('target_type').notNull(),
  targetId: uuid('target_id').notNull(),
  reason: text('reason'),
  status: text('status').default('open'),
  createdAt: timestamp('created_at').defaultNow(),
})

export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  actorId: uuid('actor_id'),
  action: text('action').notNull(),
  targetType: text('target_type'),
  targetId: uuid('target_id'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow(),
})

export const consents = pgTable('consents', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id),
  policyType: text('policy_type').notNull(),
  policyVersion: text('policy_version').notNull(),
  accepted: boolean('accepted').notNull(),
  ipAddress: text('ip_address'),
  createdAt: timestamp('created_at').defaultNow(),
})
