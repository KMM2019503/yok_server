# Pulse API — Documentation

This `docs/` folder is the working reference for the `pulse-api` backend. It exists
to "remember every section of the repo" so new features (starting with the
AI persona-profiling feature) can be built consistently against the existing
architecture.

> Runtime is **Bun**. The codebase is a **TypeScript-migration-in-progress**:
> newer `/v2` code is `.ts`, older business logic is legacy `.js`. See the repo map.

## Contents

| Doc | What it covers |
|---|---|
| [repo-map.md](repo-map.md) | Full map of the current repo — every section, file-referenced. The reference for how a request flows and where to add code. |
| [features/persona-profiling.md](features/persona-profiling.md) | Plan, flow, and architecture for the AI persona / "character tags" feature (Gemini + controlled vocabulary + user review). |

## Related

- [`../CLAUDE.md`](../CLAUDE.md) — high-level guidance and conventions (the source of truth for "how we work").
- [`../agent.md`](../agent.md) — agent notes.
- `GET /docs` (Swagger UI) and `GET /openapi.json` — live API docs, generated from [`../src/v2/docs/openapi.ts`](../src/v2/docs/openapi.ts).

## How to keep these docs honest

- When you add or change a `/v2` route, update **both** the real route file **and**
  the manual array in [`../src/v2/docs/openapi.ts`](../src/v2/docs/openapi.ts).
- When you add a module, it should match the layering described in
  [repo-map.md](repo-map.md#module-anatomy) — the [`friends/`](../src/v2/modules/friends/)
  module is the cleanest template.

_Last updated: 2026-06-28._
