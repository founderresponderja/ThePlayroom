# The Playroom

The Playroom is a privacy-first, adults-only lifestyle and dating platform for the consensual non-monogamy community, with a curated in-app marketplace for sex-shop merchants.

This repository is a Turborepo monorepo using pnpm workspaces and TypeScript.

## Layout

- `apps/mobile` — Expo React Native mobile app
- `apps/web` — Next.js landing site and app shell
- `apps/admin` — Next.js admin dashboard
- `services/api` — Node/TypeScript REST API and webhooks
- `services/realtime` — dedicated websocket/realtime messaging service
- `services/workers` — background jobs for verification, moderation, payouts, marketplace orders
- `packages/ui` — shared design system, tokens, and theme utilities
- `packages/core` — shared domain logic, types, validation, and feature modules
- `packages/db` — Drizzle/Postgres schema, migrations, and database utilities
- `packages/config` — shared tooling config for ESLint, TypeScript, and env validation
- `docs/decisions` — architectural decision records and design documentation
- `docs/legal` — legal document placeholders

## Getting started

Install dependencies:

```bash
pnpm install
```

Run local development:

```bash
pnpm dev
```

## Notes

- Mobile uses Expo managed workflow.
- Web and admin use Next.js App Router.
- Backend uses Node + Drizzle for Neon compatibility.
- Auth is planned with Clerk and payments with Stripe.
- Design tokens are centered on a vivid red + fuchsia palette with dark theme default.
