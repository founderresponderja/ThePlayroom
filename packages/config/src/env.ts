import { z } from 'zod';

export const appEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z.string().url(),
  CLERK_FRONTEND_API: z.string(),
  CLERK_API_KEY: z.string(),
  CLERK_JWT_KEY: z.string(),
  STRIPE_SECRET_KEY: z.string(),
  STRIPE_WEBHOOK_SECRET: z.string(),
  STRIPE_CONNECT_CLIENT_ID: z.string(),
  GOOGLE_MAPS_API_KEY: z.string(),
  GOOGLE_VISION_API_KEY: z.string().optional(),
  SENTRY_DSN: z.string().url().optional(),
  OPENAI_API_KEY: z.string().optional(),
  EXPO_PUSH_KEY: z.string().optional(),
  MAKE_WEBHOOK_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  CSAM_SCANNER_API_KEY: z.string().optional(),
  SUPER_ADMIN_EMAIL: z.string().email().optional(), // Explicit opt-in for bootstrap admin
  JWT_SECRET: z.string(),
  NEXTAUTH_URL: z.string().url().optional()
});

export type AppEnv = z.infer<typeof appEnvSchema>;

export function parseAppEnv(env: Record<string, string | undefined>) {
  return appEnvSchema.parse({
    ...env,
    GOOGLE_VISION_API_KEY: env.GOOGLE_VISION_API_KEY,
    SENTRY_DSN: env.SENTRY_DSN,
    EXPO_PUSH_KEY: env.EXPO_PUSH_KEY,
    MAKE_WEBHOOK_URL: env.MAKE_WEBHOOK_URL,
    UPSTASH_REDIS_REST_URL: env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: env.UPSTASH_REDIS_REST_TOKEN,
    CSAM_SCANNER_API_KEY: env.CSAM_SCANNER_API_KEY,
    SUPER_ADMIN_EMAIL: env.SUPER_ADMIN_EMAIL,
    NEXTAUTH_URL: env.NEXTAUTH_URL
  });
}

// ============================================================================
// INPUT VALIDATION SCHEMAS FOR API ENDPOINTS
// ============================================================================

// Product Management
export const createProductSchema = z.object({
  title: z.string().min(1).max(250),
  description: z.string().max(2000).default(''),
  priceCents: z.number().int().min(1),
  category: z.string().min(1).max(128),
  stock: z.number().int().min(0).default(0),
  images: z.array(z.string().url()).default([]),
  ageRestricted: z.boolean().default(true),
});

export const updateProductSchema = createProductSchema.partial();

// Event Management
export const createEventSchema = z.object({
  title: z.string().min(1).max(250),
  description: z.string().max(5000).default(''),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime().optional(),
  locationMode: z.enum(['venue', 'online', 'custom']),
  customLocation: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }).optional(),
  capacity: z.number().int().min(1).optional(),
  privacy: z.enum(['public', 'private', 'invite_only']).default('public'),
  ticketed: z.boolean().default(false),
  priceCents: z.number().int().min(0).default(0),
});

export const updateEventSchema = createEventSchema.partial();

// Club Management  
export const createClubSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(5000).default(''),
  address: z.string().max(500).optional(),
  amenities: z.array(z.string()).default([]),
  location: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }).optional(),
});

export const updateClubSchema = createClubSchema.partial();

// Admin Actions
export const adminUpdateUserSchema = z.object({
  adminRole: z.enum(['none', 'admin', 'super_admin']).optional(),
  verificationLevel: z.enum(['none', 'photo', 'video', 'social']).optional(),
});

export const adminReportActionSchema = z.object({
  action: z.enum(['approve', 'reject', 'ban', 'appeal']),
  reason: z.string().min(10).max(2000).optional(),
});

