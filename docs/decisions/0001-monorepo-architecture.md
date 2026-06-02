# 0001 — Monorepo architecture

Date: 2026-06-02

## Context

The Playroom must support mobile, web, admin, API, realtime messaging, and background workers while maximizing shared logic and design tokens.

## Decision

Use a Turborepo monorepo with pnpm workspaces.

The repository layout is:

- `apps/mobile` — Expo React Native
- `apps/web` — Next.js App Router landing and app shell
- `apps/admin` — Next.js App Router admin dashboard
- `services/api` — Node/TypeScript REST API and webhook handlers
- `services/realtime` — dedicated realtime messaging service
- `services/workers` — background jobs
- `packages/ui` — shared design system, theming, and tokens
- `packages/core` — domain logic, feature typings, and validation
- `packages/db` — Drizzle schema and migrations
- `packages/config` — shared ESLint, TypeScript, and environment validation

## Rationale

- Keeps mobile/web/admin/services aligned on core types, auth, and feature contracts.
- Supports edge-friendly backend and separate realtime service.
- Allows incremental implementation of phases.

## Notes

All secrets are stored in env vars and gated through `.env.example` and CI secrets.
