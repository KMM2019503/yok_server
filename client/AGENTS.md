<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version (Next.js 16) has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

Known v16 gotchas already accounted for in this app:
- `params` / `searchParams` in `page`/`layout` are async (Promises). This app uses client components with `useParams()` / `useSearchParams()` from `next/navigation` for dynamic routes.
- Turbopack is the default for `next dev` / `next build`.
- `middleware` convention is renamed to `proxy`.
<!-- END:nextjs-agent-rules -->

# Installed agent skills

Skills live in `.agents/skills/`. Invoke the matching skill BEFORE doing the work it covers; don't reinvent its guidance from memory.

| Skill | Use it when |
| --- | --- |
| `ui-ux-pro-max` | Designing/building/reviewing any UI: layouts, color systems, typography, component styling, animation, accessibility, choosing a visual style. The primary skill for this app's "clean & modern light/dark" direction. Includes shadcn/ui + Tailwind guidance. |
| `vercel-react-best-practices` | Writing, reviewing, or refactoring React/Next.js code for performance — components, data fetching, bundle size, re-render patterns. |
| `vercel-composition-patterns` | Designing reusable component APIs — compound components, context providers, render props, avoiding boolean-prop sprawl. Includes React 19 API changes. |
| `web-design-guidelines` | Auditing finished UI for Web Interface Guidelines / accessibility / UX compliance. |
| `writing-guidelines` | Reviewing user-facing copy, docs, or microcopy for voice/tone. |
| `vercel-optimize`, `deploy-to-vercel`, `vercel-cli-with-tokens` | Only relevant later, for deploying/optimizing on Vercel. |

Notes on requested-but-unavailable skills:
- `next-best-practices` (vercel-labs/next-skills) — that repo currently exposes no installable SKILL.md. Use `node_modules/next/dist/docs/` (authoritative for this v16) plus `vercel-react-best-practices`.
- `tailwind` (heygen-com/hyperframes) — that repo is a video-generation toolkit and has no Tailwind skill. Tailwind v4 guidance comes from `ui-ux-pro-max` and the Tailwind docs.

# Project context (frontend)

This is the frontend for the **Yok chat** backend (one level up: `../`, the `yok_server` repo).
- Backend API base: `http://localhost:9999/v2` (PORT=9999). Socket.IO: `http://localhost:9999` with `withCredentials`.
- Auth is an httpOnly cookie named `token`; all requests must send credentials. Backend CORS allows origin `http://localhost:3000` — so run this app on port 3000.
- MVP scope: auth (login/signup) + real-time direct-message chat (presence + read receipts). Stack: Next.js 16 App Router, Tailwind 4, TanStack Query, socket.io-client.
