# Agent Guide

## Project Overview

This repository is a backend API service using:

- Bun runtime (`bun`)
- Node.js/Express HTTP server
- Socket.IO realtime server
- Prisma ORM with MongoDB
- TypeScript migration in progress (mixed `.ts` + `.js` codebase)

Primary entrypoints:

- `index.ts`
- `src/server.ts`
- `socket/Socket.js`
- `prisma/schema.prisma`

## Working Rules For Agents

1. Prefer TypeScript for all new or refactored code.
2. Keep changes migration-safe for existing JavaScript modules.
3. Use Prisma Client via `prisma/prismaClient.js` for DB access.
4. Keep auth behavior compatible with current JWT + cookie flow.
5. Run lint before finalizing changes.

## Development Commands

- Start dev server: `bun --watch index.ts`
- Start server: `bun index.ts`
- Lint (TS-first): `npm run lint`
- Lint + autofix (TS-first): `npm run lint:fix`
- Lint all files (TS + JS): `npm run lint:all`

## Environment Notes

Common env keys used by this project:

- `DATABASE_URL`
- `JWT_SECRET_KEY`
- `PORT`
- `NODE_ENV`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

## Installed Skills

This project has two installed skills:

1. `nodejs-backend-patterns`
2. `prisma-client-api`

Skill files:

- `.agents/skills/nodejs-backend-patterns/SKILL.md`
- `.agents/skills/prisma-client-api/SKILL.md`

### 1) nodejs-backend-patterns

Use this skill when working on:

- Express middleware and route architecture
- service/controller layering
- auth, validation, error handling
- realtime backend patterns

### 2) prisma-client-api

Use this skill when working on:

- Prisma `findMany`, `create`, `update`, `delete`
- `where` filters and relation queries
- transactions (`$transaction`)
- query shape (`select`, `include`, pagination, sorting)

## Recommended Skill Usage Policy

1. Backend/API logic change: start with `nodejs-backend-patterns`.
2. Any Prisma query or schema-related service update: also use `prisma-client-api`.
3. For tasks touching both API and DB layers, use both skills together.
