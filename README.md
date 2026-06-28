# Yok Server

Backend server for Yok chat features, built with Bun, Express, Prisma (MongoDB), and Socket.IO.

## Stack

- Bun runtime
- Express API (`/v2` modular routes)
- Prisma + MongoDB
- Socket.IO real-time events
- Zod validation + generated OpenAPI docs

## Prerequisites

- Bun `>=1.x`
- MongoDB instance (local or hosted)

## Quick Start (Local)

1. Install dependencies:

```bash
bun install
```

2. Create a `.env` file:

```env
DATABASE_URL="mongodb+srv://<user>:<password>@<cluster>/<db>?retryWrites=true&w=majority"
JWT_SECRET_KEY="<your-secret>"
PORT=8888
NODE_ENV=development

# V2 API gate (required for any /v2 endpoint)
V2_INTERNAL_ENABLED=true

# Optional extra gate on /v2
V2_INTERNAL_TOKEN=""

# Optional (defined in env schema; currently not wired in `src/server.ts` CORS setup)
CORS_ORIGIN="http://localhost:3000"
```

3. Generate Prisma client and sync schema:

```bash
bunx prisma generate
bunx prisma db push
```

4. Start dev server:

```bash
bun run dev
```

Server starts from [`index.ts`](/Users/betterhr/Developer/personal/yok_server/index.ts) and listens on `PORT` (default `8888`).

## Important: `/v2` Internal Gate

All `/v2/*` routes are protected by [`internal-v2-gate.ts`](/Users/betterhr/Developer/personal/yok_server/src/v2/shared/middleware/internal-v2-gate.ts).

- If `V2_INTERNAL_ENABLED=false` (or unset), `/v2/*` returns `404`.
- If `V2_INTERNAL_TOKEN` is set, clients must send header:

```http
x-internal-v2-token: <your-token>
```

## Authentication Model

- Login/signup endpoints set an HTTP-only cookie named `token`.
- Protected routes use cookie auth (`requireAuth` middleware).
- Socket.IO auth also reads the same `token` cookie during handshake.

## API Docs

- Swagger UI: `GET /docs`
- OpenAPI JSON: `GET /openapi.json`
- Health check: `GET /healthy`
- V2 health check: `GET /v2/healthy` (subject to the internal gate rules above)

## Main Route Groups

- `POST /v2/login`
- `POST /v2/signup`
- `GET /v2/logout`
- `GET /v2/checkAuth`
- `GET|POST|PUT|DELETE /v2/channels/*`
- `POST /v2/messages/*`
- `GET /v2/conversations/*`
- `GET|POST|DELETE /v2/users/*`

See full request/response contracts in Swagger.

## Scripts

- `bun run dev` - Run with watch mode
- `bun run start` - Run server
- `bun run test` - Run tests
- `bun run lint` - Lint TS files
- `bun run lint:fix` - Auto-fix lint issues

## Testing

Current test suites include:

- Unit tests
- Repository tests
- Middleware tests
- Contract tests
- Integration smoke test

Run all with:

```bash
bun test
```

## Project Layout

- [`src/server.ts`](/Users/betterhr/Developer/personal/yok_server/src/server.ts) - app bootstrap, middleware, health routes, cron, shutdown
- [`src/v2/app/`](/Users/betterhr/Developer/personal/yok_server/src/v2/app) - v2 router setup
- [`src/v2/modules/`](/Users/betterhr/Developer/personal/yok_server/src/v2/modules) - feature modules (auth, users, channels, messages, conversations)
- [`src/v2/docs/openapi.ts`](/Users/betterhr/Developer/personal/yok_server/src/v2/docs/openapi.ts) - OpenAPI registry/document generation
- [`socket/Socket.js`](/Users/betterhr/Developer/personal/yok_server/socket/Socket.js) - Socket.IO server and realtime events
- [`prisma/schema.prisma`](/Users/betterhr/Developer/personal/yok_server/prisma/schema.prisma) - MongoDB data model
