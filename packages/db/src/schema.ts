import { pgTable, serial, text, timestamp, varchar, boolean, jsonb, integer } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  clerkUserId: varchar('clerk_user_id', { length: 191 }).notNull(),
  accountType: varchar('account_type', { length: 32 }).notNull(),
  displayName: varchar('display_name', { length: 100 }).notNull(),
  dateOfBirth: timestamp('date_of_birth', { mode: 'date' }),
  ageVerifiedAt: timestamp('age_verified_at', { mode: 'date' }),
  verificationLevel: varchar('verification_level', { length: 32 }).notNull().default('none'),
  onboardingComplete: boolean('onboarding_complete').notNull().default(false),
  subscriptionTier: varchar('subscription_tier', { length: 64 }),
  isVip: boolean('is_vip').notNull().default(false),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'string' }),
  deletedAt: timestamp('deleted_at', { mode: 'string' }),
  deletedBy: varchar('deleted_by', { length: 191 })
});

export const profiles = pgTable('profiles', {
  userId: integer('user_id').notNull().references(() => users.id),
  bio: text('bio').notNull().default(''),
  preferences: jsonb('preferences').notNull().default('{}'),
  interests: jsonb('interests').notNull().default('[]'),
  boundaries: jsonb('boundaries').notNull().default('[]'),
  approxLocation: jsonb('approx_location'),
  realLocation: text('real_location'),
  visibilitySettings: jsonb('visibility_settings').notNull().default('{}')
});

export const photos = pgTable('photos', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  url: text('url').notNull(),
  isPrivate: boolean('is_private').notNull().default(false),
  isPrimary: boolean('is_primary').notNull().default(false),
  moderationStatus: varchar('moderation_status', { length: 32 }).notNull().default('pending'),
  csamScanStatus: varchar('csam_scan_status', { length: 32 }).notNull().default('pending'),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
});

export const quizResults = pgTable('quiz_results', {
  userId: integer('user_id').notNull().references(() => users.id),
  quizVersion: varchar('quiz_version', { length: 64 }).notNull(),
  accountTypeAtTime: varchar('account_type_at_time', { length: 32 }).notNull(),
  answers: jsonb('answers').notNull().default('[]'),
  derivedTags: jsonb('derived_tags').notNull().default('[]'),
  archetype: varchar('archetype', { length: 128 }),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
});


export const clubs = pgTable('clubs', {
  id: serial('id').primaryKey(),
  ownerUserId: integer('owner_user_id').notNull().references(() => users.id),
  name: varchar('name', { length: 200 }).notNull(),
  description: text('description').notNull().default(''),
  location: jsonb('location'),
  address: text('address'),
  amenities: jsonb('amenities').notNull().default('[]'),
  verified: boolean('verified').notNull().default(false)
});

export const events = pgTable('events', {
  id: serial('id').primaryKey(),
  creatorType: varchar('creator_type', { length: 32 }).notNull(),
  creatorId: integer('creator_id').notNull(),
  clubId: integer('club_id').references(() => clubs.id),
  title: varchar('title', { length: 250 }).notNull(),
  description: text('description').notNull().default(''),
  startsAt: timestamp('starts_at', { mode: 'string' }).notNull(),
  endsAt: timestamp('ends_at', { mode: 'string' }),
  locationMode: varchar('location_mode', { length: 32 }).notNull(),
  customLocation: jsonb('custom_location'),
  capacity: integer('capacity'),
  privacy: varchar('privacy', { length: 32 }).notNull().default('public'),
  ticketed: boolean('ticketed').notNull().default(false),
  priceCents: integer('price_cents')
});

export const reservations = pgTable('reservations', {
  id: serial('id').primaryKey(),
  eventId: integer('event_id').notNull().references(() => events.id),
  userId: integer('user_id').notNull().references(() => users.id),
  status: varchar('status', { length: 32 }).notNull().default('requested'),
  priorityScore: integer('priority_score').notNull().default(0),
  paymentIntentId: varchar('payment_intent_id', { length: 191 }),
  locationRevealedAt: timestamp('location_revealed_at', { mode: 'string' })
});

export const matches = pgTable('matches', {
  id: serial('id').primaryKey(),
  userAId: integer('user_a_id').notNull().references(() => users.id),
  userBId: integer('user_b_id').notNull().references(() => users.id),
  algo: varchar('algo', { length: 32 }).notNull().default('random'),
  score: integer('score'),
  status: varchar('status', { length: 32 }).notNull().default('pending')
});

export const threads = pgTable('threads', {
  id: serial('id').primaryKey(),
  participantAId: integer('participant_a_id').notNull().references(() => users.id),
  participantBId: integer('participant_b_id').notNull().references(() => users.id),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow()
});

export const messages = pgTable('messages', {
  id: serial('id').primaryKey(),
  threadId: integer('thread_id').notNull().references(() => threads.id),
  senderId: integer('sender_id').notNull().references(() => users.id),
  encryptedPayload: text('encrypted_payload').notNull(),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow()
});

export const subscriptions = pgTable('subscriptions', {
  userId: integer('user_id').notNull().references(() => users.id),
  stripeCustomerId: varchar('stripe_customer_id', { length: 191 }).notNull(),
  stripeSubscriptionId: varchar('stripe_subscription_id', { length: 191 }).notNull(),
  plan: varchar('plan', { length: 100 }).notNull(),
  status: varchar('status', { length: 64 }).notNull(),
  currentPeriodEnd: timestamp('current_period_end', { mode: 'string' })
});

export const entitlements = pgTable('entitlements', {
  userId: integer('user_id').notNull().references(() => users.id),
  feature: varchar('feature', { length: 128 }).notNull(),
  active: boolean('active').notNull().default(false),
  source: varchar('source', { length: 128 }).notNull().default('stripe')
});

export const shops = pgTable('shops', {
  id: serial('id').primaryKey(),
  ownerUserId: integer('owner_user_id').notNull().references(() => users.id),
  name: varchar('name', { length: 200 }).notNull(),
  description: text('description').notNull().default(''),
  logoUrl: text('logo_url'),
  stripeConnectAccountId: varchar('stripe_connect_account_id', { length: 191 }),
  payoutsEnabled: boolean('payouts_enabled').notNull().default(false),
  status: varchar('status', { length: 32 }).notNull().default('pending'),
  verified: boolean('verified').notNull().default(false)
});

export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  shopId: integer('shop_id').notNull().references(() => shops.id),
  title: varchar('title', { length: 250 }).notNull(),
  description: text('description').notNull().default(''),
  images: jsonb('images').notNull().default('[]'),
  priceCents: integer('price_cents').notNull(),
  currency: varchar('currency', { length: 8 }).notNull().default('EUR'),
  category: varchar('category', { length: 128 }).notNull(),
  stock: integer('stock').notNull().default(0),
  ageRestricted: boolean('age_restricted').notNull().default(true),
  moderationStatus: varchar('moderation_status', { length: 32 }).notNull().default('pending'),
  active: boolean('active').notNull().default(true)
});

export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  buyerUserId: integer('buyer_user_id').notNull().references(() => users.id),
  status: varchar('status', { length: 32 }).notNull().default('pending'),
  paymentIntentId: varchar('payment_intent_id', { length: 191 }),
  totalCents: integer('total_cents').notNull().default(0),
  platformFeeCents: integer('platform_fee_cents').notNull().default(0),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow()
});

export const orderItems = pgTable('order_items', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id').notNull().references(() => orders.id),
  productId: integer('product_id').notNull().references(() => products.id),
  shopId: integer('shop_id').notNull().references(() => shops.id),
  qty: integer('qty').notNull().default(1),
  unitPriceCents: integer('unit_price_cents').notNull(),
  feeCents: integer('fee_cents').notNull().default(0)
});

export const payouts = pgTable('payouts', {
  id: serial('id').primaryKey(),
  shopId: integer('shop_id').notNull().references(() => shops.id),
  stripeTransferId: varchar('stripe_transfer_id', { length: 191 }),
  amountCents: integer('amount_cents').notNull().default(0),
  status: varchar('status', { length: 32 }).notNull().default('pending'),
  periodRef: varchar('period_ref', { length: 64 })
});

export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  type: varchar('type', { length: 128 }).notNull(),
  payload: jsonb('payload').notNull().default('{}'),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
  readAt: timestamp('read_at', { mode: 'string' })
});

export const reports = pgTable('reports', {
  id: serial('id').primaryKey(),
  reporterUserId: integer('reporter_user_id').references(() => users.id),
  targetType: varchar('target_type', { length: 64 }).notNull(),
  targetId: integer('target_id').notNull(),
  reason: text('reason').notNull(),
  evidence: jsonb('evidence'),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
  status: varchar('status', { length: 32 }).notNull().default('open')
});

export const auditLogs = pgTable('audit_logs', {
  id: serial('id').primaryKey(),
  actorUserId: integer('actor_user_id').references(() => users.id),
  action: varchar('action', { length: 128 }).notNull(),
  resourceType: varchar('resource_type', { length: 64 }).notNull(),
  resourceId: integer('resource_id'),
  data: jsonb('data').notNull().default('{}'),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow()
});

export const consents = pgTable('consents', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  policy: varchar('policy', { length: 128 }).notNull(),
  version: varchar('version', { length: 64 }).notNull(),
  acceptedAt: timestamp('accepted_at', { mode: 'string' }).notNull().defaultNow()
});
