# Agent Guide

> **Source of truth: [`CLAUDE.md`](CLAUDE.md).** It has the full architecture, commands,
> environment, and the legacy-bridge / dual-validation / OpenAPI-mirroring gotchas.
> This file only restates the agent-specific working rules and skill policy.

## Snapshot

`pulse-api` — Bun + Express + Socket.IO + Prisma (MongoDB) backend for the **Pulse** chat app.
The frontend lives in a **separate repo, `pulse-web`** (https://github.com/KMM2019503/pulse-web).
Mixed `.ts` (new `/v2` modules) + `.js` (legacy services) — a TypeScript migration in progress.

Entrypoints: [`index.ts`](index.ts) → [`src/server.ts`](src/server.ts) (mounts onto the app/server
created in [`socket/Socket.js`](socket/Socket.js)) → [`src/v2/app/`](src/v2/app) → modules.

## Working rules for agents

1. Prefer TypeScript for new or refactored code.
2. Keep changes migration-safe for the remaining JavaScript modules.
3. Real business logic usually lives in the legacy `src/v2/services/*.services.js` files,
   reached through each module's `repository.ts` + `buildLegacyRequest`. Edit there, not just
   the thin TS service.
4. Access the DB via the Prisma client (`src/v2/shared/db/prisma.ts`, which re-exports
   `prisma/prismaClient.js`).
5. Keep auth compatible with the JWT + `token` cookie flow (`req.auth.userId` *and* `req.userid`).
6. Adding/changing a `/v2` route? Update the Zod schema, the route wiring, **and** the
   hand-mirrored `routes[]` in [`src/v2/docs/openapi.ts`](src/v2/docs/openapi.ts).
7. Run `bun run lint` before finalizing.

## Commands

- Dev: `bun run dev` · Run: `bun run start`
- Test: `bun test` · single file: `bun test <path>` · by name: `bun test -t "<name>"`
- Lint (TS): `bun run lint` · all files: `bun run lint:all` · autofix: `bun run lint:fix`
- Prisma: `bunx prisma generate` then `bunx prisma db push` after schema changes

## Installed skills ([`.agents/skills/`](.agents/skills))

1. **nodejs-backend-patterns** — Express middleware/routing, controller→service→repository
   layering, auth, validation, error handling, realtime patterns.
2. **prisma-client-api** — Prisma `findMany`/`create`/`update`/`delete`, `where` filters,
   relations, `$transaction`, query shape (`select`/`include`/pagination/sorting).

Policy: backend/API logic → start with `nodejs-backend-patterns`; any Prisma/schema work →
also use `prisma-client-api`; tasks touching both layers → use both together.
