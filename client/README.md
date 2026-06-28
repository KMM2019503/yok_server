# Yok — Web Client

Frontend for the **Yok chat** backend (`../`, the `yok_server` repo).

- **Stack:** Next.js 16 (App Router) · React 19 · Tailwind 4 · TanStack Query · socket.io-client
- **MVP scope:** auth (login / signup) + real-time direct-message chat with presence and read receipts
- **Design:** clean & modern, full light/dark via `next-themes`

## Prerequisites

The backend must be running and reachable. By default this client targets
`http://localhost:9999` (the backend's `PORT`). The backend's CORS + Socket.IO
are configured for an origin of `http://localhost:3000`, so **run this app on
port 3000**.

```bash
# In ../ (yok_server)
bun run dev          # starts API + Socket.IO on :9999
```

## Run the client

```bash
bun install
PORT=3000 bun run dev      # http://localhost:3000
```

Configuration lives in `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:9999
# Only if the backend sets V2_INTERNAL_TOKEN:
# NEXT_PUBLIC_V2_INTERNAL_TOKEN=
```

## How it talks to the backend

| Concern | Detail |
| --- | --- |
| Auth | httpOnly `token` cookie; every request uses `credentials: "include"` |
| REST base | `${NEXT_PUBLIC_API_URL}/v2` |
| Realtime | Socket.IO on the same origin (`withCredentials`) |
| Receive DM | `incomingNewMessage` → `{ message, updatedConversation }` |
| Presence | `pullOnlineUsers` (array of online user ids) |
| Read receipts | client emits `markMessagesAsRead`; sender receives `messagesStatusUpdated` |

## Structure

```
src/
  app/
    (auth)/            login + signup (branded split-screen)
    (app)/chat/        guarded chat shell, empty state, [conversationId] thread
  components/
    ui/                button, input, avatar, spinner, skeleton
    chat/              sidebar, conversation list/item, header, message list/bubble, composer
  hooks/               use-conversations, use-messages, use-send-message, use-realtime
  lib/                 api (fetch), socket, types, chat-utils, env
  providers/           query-provider, auth-provider
```

## Scripts

```bash
bun run dev            # dev server (Turbopack)
bun run build          # production build
bunx tsc --noEmit      # typecheck
bunx eslint src        # lint
```

## Not yet built (next milestones)

Channels, groups, friends/contacts, profile settings, starting a brand-new
conversation (find-user-by-phone), and message attachments. The backend already
exposes endpoints for most of these under `/v2`.
