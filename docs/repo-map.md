# Repo Map — Pulse API

A file-referenced map of every section of the backend. Use this when adding a
feature: find the section you're touching, copy the established pattern.

- **What this is:** `pulse-api` is the backend for **Pulse**, a real-time chat app
  (auth, direct/group/channel messaging, presence). The frontend is a separate
  repo, **`pulse-web`**. The integration boundary is `CORS_ORIGIN` + the
  cookie/Socket.IO auth contract.
- **Runtime:** **Bun** (not Node directly). No build step — Bun runs `.ts` directly
  (`tsconfig.json` is `noEmit`).
- **Migration state:** newer `/v2` code is `.ts`; older business logic is legacy
  `.js` in [`src/v2/services/`](../src/v2/services/). Both run side by side.

---

## 1. Server boot & the two-Express subtlety

The Express `app` and the underlying `http.Server` are **created in
[`socket/Socket.js`](../socket/Socket.js)**, not in `server.ts`. Socket.IO is
attached there.

```
index.ts  ──calls──▶  startServer()  (src/server.ts)
                          │  imports the SAME app + server from socket/Socket.js
                          │  mounts middleware + routes onto app
                          └─ server.listen(PORT)
```

Consequences:
- Socket.IO and the REST API **share one server/port**.
- Because of Socket.IO + a `node-cron` daily job (stale FCM-token cleanup), the
  server **must run as a single long-lived instance** — no serverless, and scaling
  to multiple replicas would require a Socket.IO adapter (e.g. Redis). _This is why
  an in-process background worker is viable for the persona feature (see that doc)._

---

## 2. The `/v2` request pipeline

All real REST routes live under `/v2`.

```
src/v2/app/create-app.ts  ──▶  register-routes.ts  ──▶  per-module routes
```

- [`src/v2/app/create-app.ts`](../src/v2/app/create-app.ts) — builds the `/v2` router,
  wires shared middleware (request logger, internal gate, error handler).
- [`src/v2/app/register-routes.ts`](../src/v2/app/register-routes.ts) — mounts each
  module router: `/` (auth), `/users`, `/channels`, `/messages`, `/conversations`,
  `/friends`. **A new module is registered here.**

### The internal `/v2` gate (easy to trip over locally)

[`internalV2Gate`](../src/v2/shared/middleware/internal-v2-gate.ts) runs before all
`/v2` routes:
- If `V2_INTERNAL_ENABLED` is not `true`, **every `/v2/*` route returns 404**.
- If `V2_INTERNAL_TOKEN` is set, requests must also send header `x-internal-v2-token`.

If `/v2` endpoints 404 unexpectedly, check `V2_INTERNAL_ENABLED=true` in `.env` first.

---

## 3. Module anatomy

Each feature module in [`src/v2/modules/`](../src/v2/modules/) follows a fixed layering:

```
routes.ts → controller.ts → service.ts → repository.ts → [ legacy *.services.js ]
            (Express I/O)    (thin        (DB access /     (only older modules:
                              delegate)    legacy bridge)    real business logic)
```

Plus, per module: `*.schema.ts` (Zod), `*.types.ts`, `*.mapper.ts` (response shaping).

### Two flavors of repository

| Flavor | Example | What the repository does |
|---|---|---|
| **Direct Prisma (preferred, newest)** | [`friends/`](../src/v2/modules/friends/) | Talks to Prisma directly; all logic lives in TS. **Use this template for new modules.** |
| **Legacy bridge** | [`users/`](../src/v2/modules/users/), `channels`, `messages`, `conversations` | Repository wraps old `.js` service functions; real logic still lives in the legacy `.js`. |

Reference files for the preferred pattern:
- [`friends.routes.ts`](../src/v2/modules/friends/friends.routes.ts) — `requireAuth` + `validate(schema)` per route.
- [`friends.controller.ts`](../src/v2/modules/friends/friends.controller.ts) — thin Express I/O.
- [`friends.service.ts`](../src/v2/modules/friends/friends.service.ts) — delegates to an injected repository (constructor injection → testable).
- [`friends.repository.ts`](../src/v2/modules/friends/friends.repository.ts) — Prisma queries, cursor pagination (`buildPage`/`nextCursorFor`), `publicUserSelect`, throws `AppError` subclasses.

### Modules present today

| Path | Mounted at | Notes |
|---|---|---|
| [`auth/`](../src/v2/modules/auth/) | `/v2/` | signup/login/logout/checkAuth. Issues the JWT cookie. |
| [`users/`](../src/v2/modules/users/) | `/v2/users` | search (direct Prisma), update/delete/fcm/location (legacy bridge). |
| [`channels/`](../src/v2/modules/channels/) | `/v2/channels` | adds `requireSuperAdmin` / `requireChannelAdmin`. |
| [`messages/`](../src/v2/modules/messages/) | `/v2/messages` | `message.services` exists as BOTH `.js` and `.ts` — check which the repository imports before editing. |
| [`conversations/`](../src/v2/modules/conversations/) | `/v2/conversations` | legacy bridge. |
| [`friends/`](../src/v2/modules/friends/) | `/v2/friends` | newest, cleanest, no legacy. **Template.** |

---

## 4. The legacy bridge

The repository for older modules wraps the legacy `.js` service functions in
[`src/v2/services/`](../src/v2/services/). Those functions were originally Express
handlers — they expect a `req`-like object (`{ headers: { userid }, params, query,
body }`) and now **return** data (or throw `AppError`) instead of writing to `res`.

- [`buildLegacyRequest`](../src/v2/shared/legacy/legacy-request.ts) builds the fake
  request; the module mapper formats the response.
- Legacy services present: `message.services.js`, `conversation.services.js`,
  `location.services.js`, `common.services.js`, `channel.services.js`,
  `users.services.js` (+ `message.services.ts`).
- **When changing behavior in an older module, the real logic is usually in the
  legacy `.js`, not the thin TS service/repository.**

New modules (like persona) should **skip the bridge** and use Prisma directly.

---

## 5. Validation — two systems (don't confuse them)

| System | Where | Role |
|---|---|---|
| **Zod (new)** | `*.schema.ts` per module, applied by [`validate`](../src/v2/shared/middleware/validate.ts) on `{ body, params, query }`. Also the source for OpenAPI generation. | **New rules go here.** |
| **Joi (legacy)** | inside the `.js` services / [`src/v2/validation/`](../src/v2/validation/) | Runs again, deeper in the stack. Only touch if a legacy service needs it. |

A request can be validated **twice**. For new modules, only Zod applies.

---

## 6. Auth model

- JWT stored in an **httpOnly cookie named `token`**.
- [`requireAuth`](../src/v2/shared/middleware/auth.ts) verifies it and sets **both**
  `req.auth.userId` (new code) **and** `req.userid` (legacy-compat). Keep both working.
- Channel mutations add [`requireSuperAdmin` / `requireChannelAdmin`](../src/v2/shared/middleware/channel-access.ts).
- Socket.IO re-reads the same `token` cookie during the handshake
  ([`socket/Socket.js`](../socket/Socket.js)).
- Cookie is set in [`auth.controller.ts`](../src/v2/modules/auth/auth.controller.ts)
  (httpOnly, `secure` in prod, `sameSite: "strict"`). Note signup uses a short
  3-minute cookie maxAge — **so do not block signup on slow work like an AI call.**

---

## 7. Errors

- `AppError` hierarchy in [`src/v2/shared/errors/`](../src/v2/shared/errors/):
  `ValidationError` (400), `UnauthorizedError` (401), `ForbiddenError` (403),
  `NotFoundError` (404), `ConflictError` (409).
- [`errorHandler`](../src/v2/shared/middleware/error-handler.ts) is mounted on the
  `/v2` router and maps `AppError` → its status; unknown errors → 500.
- **Mixed behavior:** many controllers *also* wrap calls in try/catch and return 500
  directly (e.g. [`auth.controller.ts`](../src/v2/modules/auth/auth.controller.ts)).
  Newer modules prefer letting `AppError` bubble to `errorHandler` — prefer that.
- [`async-handler`](../src/v2/shared/middleware/async-handler.ts) wraps async
  controllers so thrown errors reach the error handler.

---

## 8. Data layer

- **Prisma + MongoDB**, schema in [`prisma/schema.prisma`](../prisma/schema.prisma).
- Mongo uses **`db push`**, not migrations.
- Client is instantiated in `prisma/prismaClient.js` and re-exported through
  [`src/v2/shared/db/prisma.ts`](../src/v2/shared/db/prisma.ts) — **import from there
  in TS.**
- `binaryTargets` are set for native dev + Debian/arm64 (Docker image).

### Core models

`User`, `Friendship`, `FriendRequest`, `Conversation` / `ConversationMember`,
`Group` / `GroupMember`, `Channel` / `ChannelMember`, `Message` (with embedded
`SeenStatus`, `References`, `LastMessage` types), `Comment`, `Contact`,
`PinnedItem`, `fileUrls`.

`User` already has `blockedUserIds String[]` and the friend relations — relevant to
suggestion filtering later.

### After schema edits

```bash
bunx prisma generate   # regenerate client
bunx prisma db push    # sync to MongoDB
```

---

## 9. Environment

Validated by **Zod** in [`src/v2/config/env.ts`](../src/v2/config/env.ts) (throws on
missing/invalid at boot). Copy `.env.example` → `.env`.

| Var | Required | Notes |
|---|---|---|
| `DATABASE_URL` | ✅ | MongoDB connection string. |
| `JWT_SECRET_KEY` | ✅ | JWT signing. |
| `V2_INTERNAL_ENABLED` | for local `/v2` | must be `true` or all `/v2` routes 404. |
| `V2_INTERNAL_TOKEN` | optional | if set, requires `x-internal-v2-token` header. |
| `CORS_ORIGIN` | ✅ (defaulted) | comma-separated list supported, see [`config/cors.ts`](../src/v2/config/cors.ts). |
| `PORT` | optional | default 8888 in config; 9999 locally / injected by PaaS per CLAUDE.md. |
| Cloudinary keys | optional | media uploads (read directly, not in `env.ts`). |

**New env vars are added to the Zod schema in `env.ts`** (e.g. the persona feature
adds `GEMINI_API_KEY`, `PERSONA_AI_MODEL`, `PERSONA_AI_ENABLED`).

---

## 10. OpenAPI docs are hand-mirrored

[`src/v2/docs/openapi.ts`](../src/v2/docs/openapi.ts) holds a manual `routes[]` array
that mirrors the real Express routes (served via [`swagger.ts`](../src/v2/docs/swagger.ts)
at `GET /docs` and `GET /openapi.json`). **Adding or changing a `/v2` route requires
updating this array too**, or the docs drift. (The doc title is "Pulse Server API".)

---

## 11. Testing

- Runner: Bun's built-in `bun:test`.
- Tests live in [`src/v2/tests/`](../src/v2/tests/): `unit/`, `repository/`,
  `middleware/`, `contract/`, `integration/`.
- Services and repositories use **constructor dependency injection** (e.g.
  `AuthService(repository)`, `AuthRepository(db)`), so unit tests inject fakes and
  run without a DB/network. **New external integrations (like the Gemini extractor)
  should be injectable for the same reason.**

```bash
bun test                                  # all
bun test src/v2/tests/unit/friends.service.test.ts   # single file
bun test -t "delegates create"            # filter by name
```

---

## 12. Installed agent skills

[`.agents/skills/`](../.agents/skills/) ships:
- **nodejs-backend-patterns** — Express middleware/routing, controller/service/
  repository layering, auth, validation, error handling, realtime.
- **prisma-client-api** — Prisma queries, `where` filters, relations, `$transaction`,
  `select`/`include`/pagination.

Prefer them for matching work.

---

## Commands cheat-sheet

```bash
bun install
bun run dev          # watch-mode dev server (bun --watch index.ts)
bun run start        # run once
bun test             # tests
bun run lint         # ESLint (TS only) — run before finalizing
bun run lint:all     # ESLint over TS + legacy JS
bunx prisma generate # after schema edits
bunx prisma db push  # sync schema to MongoDB
```

_Last updated: 2026-06-28._
