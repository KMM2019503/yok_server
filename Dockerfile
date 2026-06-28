# syntax=docker/dockerfile:1
#
# Portable image for pulse-api (Express + Socket.IO + Prisma, run by Bun).
# Works on Render / Railway / Fly.io / any Docker host. The platform injects
# PORT and the other env vars; the server reads process.env.PORT (default 9999).

FROM oven/bun:1 AS base
WORKDIR /app
ENV NODE_ENV=production

# 1) Install dependencies first (cached unless package.json / bun.lock change)
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# 2) Copy source and generate the Prisma client (needs schema + prisma CLI)
COPY . .
RUN bunx prisma generate

# 3) Run. Socket.IO needs a single long-running instance (not serverless).
EXPOSE 9999
CMD ["bun", "run", "start"]
