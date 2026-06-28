# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

`pulse-api` is the backend for **Pulse**, a real-time chat app (auth, direct/group/channel messaging, presence). The frontend is a **separate repository, `pulse-web`** (https://github.com/KMM2019503/pulse-web) — it is not part of this project. Treat `CORS_ORIGIN` and the cookie/Socket.IO auth contract as the integration boundary with it.

Runtime is **Bun** (not Node directly). The codebase is a **TypeScript-migration-in-progress**: newer `/v2` code is `.ts`, while the underlying business logic still lives in legacy `.js` services. Both run side by side via Bun's transpilation.

## Commands

```bash
bun install                  # install deps
bun run dev                  # watch-mode dev server (bun --watch index.ts)
bun run start                # run server once

bun test                                         # all tests (Bun's built-in runner, bun:test)
bun test src/v2/tests/unit/channels.service.test.ts   # single file
bun test -t "delegates create"                   # filter by test name

bun run lint                 # ESLint, TS files only
bun run lint:fix             # + autofix
bun run lint:all             # ESLint over everything (TS + legacy JS)

bunx prisma generate         # regenerate Prisma client after schema edits
bunx prisma db push          # sync schema to MongoDB (no migrations — Mongo uses db push)
```

There is no compile/build step (`tsconfig.json` is `noEmit`; Bun runs TS directly).

## Architecture

### Two Express instances, one HTTP server (subtle)

The Express `app` and the underlying `http.Server` are **created in [`socket/Socket.js`](socket/Socket.js)**, not in `server.ts`. `Socket.IO` is attached there. [`src/server.ts`](src/server.ts) imports that *same* `app`/`server`, mounts middleware + routes onto the app, then calls `server.listen(...)`. So Socket.IO and the REST API share one server/port. [`index.ts`](index.ts) just calls `startServer()`.

Because of Socket.IO + a `node-cron` daily job (stale FCM token cleanup), the server **must run as a single long-lived instance** — it cannot go serverless, and scaling to multiple replicas would need a Socket.IO adapter (e.g. Redis).

### The `/v2` module pipeline + legacy bridge (most important pattern)

All real REST routes live under `/v2` ([`src/v2/app/create-app.ts`](src/v2/app/create-app.ts) → [`register-routes.ts`](src/v2/app/register-routes.ts)). Each feature module in [`src/v2/modules/`](src/v2/modules) (auth, users, channels, messages, conversations) follows a fixed layering:

```
routes.ts → controller.ts → service.ts → repository.ts → legacy *.services.js
            (Express I/O)    (thin       (adapts to       (real DB/business
                              delegate)   legacy shape)     logic, Prisma + Joi)
```

The key bridge: the **repository** wraps the old `.js` service functions in [`src/v2/services/`](src/v2/services). Those legacy functions were originally Express handlers — they expect a `req`-like object (`{ headers: { userid }, params, query, body }`) and now *return* data (or throw `AppError`) instead of writing to `res`. The repository builds that fake request with [`buildLegacyRequest`](src/v2/shared/legacy/legacy-request.ts) and the mapper formats the response. **When changing behavior, the actual logic is usually in the legacy `.js` service, not the thin TS service/repository.**

`message.services` exists as both `.js` and `.ts` — a partial migration; check which one the repository imports before editing.

### Two validation systems (don't confuse them)

- **Zod** (new): `*.schema.ts` per module, applied by the [`validate`](src/v2/shared/middleware/validate.ts) middleware on `{ body, params, query }`, and *also* the source for OpenAPI generation.
- **Joi** (legacy): inside the `.js` services / [`src/v2/validation/`](src/v2/validation). Runs again, deeper in the stack.

So a request can be validated twice. New rules should go in the Zod schema; only touch Joi if the legacy service needs it.

### OpenAPI docs are hand-mirrored

[`src/v2/docs/openapi.ts`](src/v2/docs/openapi.ts) holds a manual `routes[]` array that mirrors the real Express routes. **Adding or changing a `/v2` route requires updating this array too**, or the docs drift. Served at `GET /docs` (Swagger UI) and `GET /openapi.json`. (The OpenAPI doc title is "Pulse Server API".)

### Auth model

JWT stored in an **httpOnly cookie named `token`**. [`requireAuth`](src/v2/shared/middleware/auth.ts) verifies it and sets *both* `req.auth.userId` (new code) and `req.userid` (legacy-compat). Channel mutations add [`requireSuperAdmin` / `requireChannelAdmin`](src/v2/shared/middleware/channel-access.ts). Socket.IO re-reads the same `token` cookie during the handshake ([`socket/Socket.js`](socket/Socket.js)).

### The `/v2` internal gate (easy to trip over locally)

[`internalV2Gate`](src/v2/shared/middleware/internal-v2-gate.ts) runs before all `/v2` routes:
- If `V2_INTERNAL_ENABLED` is not `true`, **every `/v2/*` route returns 404** (looks like the route doesn't exist).
- If `V2_INTERNAL_TOKEN` is set, requests must also send header `x-internal-v2-token`.

If `/v2` endpoints 404 unexpectedly, check `V2_INTERNAL_ENABLED=true` in `.env` first.

### Errors

`AppError` hierarchy in [`src/v2/shared/errors/`](src/v2/shared/errors) (`ValidationError` 400, `UnauthorizedError` 401, `ForbiddenError` 403, `NotFoundError` 404). The [`errorHandler`](src/v2/shared/middleware/error-handler.ts) is mounted on the `/v2` router and maps `AppError` → its status; unknown errors → 500. Note many controllers *also* wrap calls in try/catch and return 500 directly, so behavior is mixed across modules.

### Data layer

Prisma + **MongoDB** ([`prisma/schema.prisma`](prisma/schema.prisma)). The client is instantiated in `prisma/prismaClient.js` and re-exported through [`src/v2/shared/db/prisma.ts`](src/v2/shared/db/prisma.ts); import from there in TS. Core models: `User`, `Conversation`/`ConversationMember`, `Channel`/`ChannelMember`, `Group`/`GroupMember`, `Message` (with embedded `SeenStatus`, `References`, `LastMessage` types), `Comment`, `Friendship`/`FriendRequest`, `Contact`, `PinnedItem`. Prisma `binaryTargets` are set for both native dev and the Debian/arm64 Docker image.

## Environment

Validated by Zod in [`src/v2/config/env.ts`](src/v2/config/env.ts) (throws on missing/invalid at boot). Copy `.env.example` → `.env`. Required: `DATABASE_URL`, `JWT_SECRET_KEY`. Important for local dev: `V2_INTERNAL_ENABLED=true`, `CORS_ORIGIN` (comma-separated list supported, see [`config/cors.ts`](src/v2/config/cors.ts)). Optional: `V2_INTERNAL_TOKEN`, `PORT` (default 9999 locally / injected by PaaS), Cloudinary keys (media uploads).

## Installed agent skills

[`.agents/skills/`](.agents/skills) ships two skills — prefer them for matching work:
- **nodejs-backend-patterns** — Express middleware/routing, controller/service/repository layering, auth, validation, error handling, realtime.
- **prisma-client-api** — Prisma queries (`findMany`/`create`/`update`/`delete`), `where` filters, relations, `$transaction`, `select`/`include`/pagination.

Use both together for tasks spanning API + DB.

## Conventions

- Prefer TypeScript for new/refactored code; keep changes migration-safe for the remaining `.js` modules.
- Keep the JWT-cookie auth flow compatible (both `req.auth.userId` and `req.userid` are relied on).
- Run `bun run lint` before finalizing.
