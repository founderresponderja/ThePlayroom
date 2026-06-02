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
  EXPO_PUSH_KEY: z.string().optional(),
  MAKE_WEBHOOK_URL: z.string().url().optional(),
  JWT_SECRET: z.string(),
  NEXTAUTH_URL: z.string().url().optional()
});

export type AppEnv = z.infer<typeof appEnvSchema>;

export function parseAppEnv(env: Record<string, string | undefined>) {
  return appEnvSchema.parse({
    ...env,
    EXPO_PUSH_KEY: env.EXPO_PUSH_KEY,
    MAKE_WEBHOOK_URL: env.MAKE_WEBHOOK_URL,
    NEXTAUTH_URL: env.NEXTAUTH_URL
  });
}
