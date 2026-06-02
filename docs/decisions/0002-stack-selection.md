# 0002 — Stack selection

Date: 2026-06-02

## Decision

The Playroom uses the following locked stack:

- Mobile: Expo React Native managed workflow
- Web: Next.js App Router on Vercel
- Admin: Next.js App Router on Vercel
- Backend: Node.js with TypeScript
- Database: Neon serverless Postgres
- ORM: Drizzle for edge friendliness
- Auth: Clerk
- Payments: Stripe Billing + Stripe Connect
- Maps: Google Maps
- Automation: Make.com
- CI/CD: GitHub Actions with deploys to Vercel and EAS

## Rationale

This stack matches the product requirements, supports high shared-code reuse, and aligns with platform constraints including serverless/Vercel and Expo.
