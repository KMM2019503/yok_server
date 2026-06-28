# Pulse API

Backend for **Pulse**, a real-time chat app — built with Bun, Express, Prisma (MongoDB), and Socket.IO. Pairs with the [`pulse-web`](https://github.com/KMM2019503/pulse-web) frontend.

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

2. Create a `.env` file (copy the template, then fill it in):

```bash
cp .env.example .env
```

Key variables:

```env
DATABASE_URL="mongodb+srv://<user>:<password>@<cluster>/<db>?retryWrites=true&w=majority"
JWT_SECRET_KEY="<your-secret>"
PORT=9999
NODE_ENV=development

# Required for any /v2 endpoint (otherwise 404)
V2_INTERNAL_ENABLED=true
# Optional extra header gate on /v2
V2_INTERNAL_TOKEN=

# Origin(s) allowed to call the API / Socket.IO. Comma-separated for multiple.
CORS_ORIGIN=http://localhost:3000
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

Server starts from [`index.ts`](index.ts) and listens on `PORT` (default `9999`).

## Deploy

The server needs **one long-running instance** (Socket.IO + `node-cron` rule out serverless). A portable [`Dockerfile`](Dockerfile) (based on `oven/bun`) is included, so it runs on Render, Railway, Fly.io, or any Docker host without code changes.

```bash
docker build -t pulse-api .
docker run -p 9999:9999 --env-file .env pulse-api
```

On a PaaS (e.g. Render / Railway):

1. Point the service at this repo; it auto-detects the `Dockerfile`.
2. Set env vars from `.env.example` (the platform injects `PORT`).
3. Set `CORS_ORIGIN` to your deployed `pulse-web` URL (HTTPS).
4. Health check path: `/healthy`.

> Scaling to multiple replicas requires a Socket.IO adapter (e.g. Redis) for cross-instance events — single instance is fine to start.

## Important: `/v2` Internal Gate

All `/v2/*` routes are protected by [`internal-v2-gate.ts`](src/v2/shared/middleware/internal-v2-gate.ts).

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

- [`src/server.ts`](src/server.ts) - app bootstrap, middleware, health routes, cron, shutdown
- [`src/v2/app/`](src/v2/app) - v2 router setup
- [`src/v2/modules/`](src/v2/modules) - feature modules (auth, users, channels, messages, conversations)
- [`src/v2/docs/openapi.ts`](src/v2/docs/openapi.ts) - OpenAPI registry/document generation
- [`socket/Socket.js`](socket/Socket.js) - Socket.IO server and realtime events
- [`prisma/schema.prisma`](prisma/schema.prisma) - MongoDB data model
