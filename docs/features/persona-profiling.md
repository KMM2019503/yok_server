# Feature: AI Persona Profiling ("character tags")

**Status:** Phase 1 integrated across backend and frontend. **Owner:** —. **Last updated:** 2026-06-28.

## Goal

At onboarding, ask the user for a free-text **story** about themselves (who they are,
favorites, lifestyle, characteristics, emotions). Parse it with **Gemini** into a set
of normalized **character tags** drawn from a **controlled vocabulary**, show those
tags back to the user for review/confirmation, and store the confirmed set. Those
tags later power **friend** and **channel** suggestions.

> Example story → tags
> *"I'm a developer, I love football, my idol is Ronaldo, I'm open-minded and
> extroverted, and I like horror movies."*
> → `#developer` · `#football` · `#cristiano-ronaldo` · `#open-minded` ·
> `#extrovert` · `#horror-movies`
> each carrying a **category** (profession / sport / fandom / personality / media)
> and a **confidence**.

## Current implementation status

### Backend integrated

- `UserProfile` + `ProfileStatus` are live in Prisma, including `SKIPPED`, `AWAITING_REVIEW`, `READY`, and `FAILED`.
- Env wiring is done for `GEMINI_API_KEY`, `PERSONA_AI_MODEL`, and `PERSONA_AI_ENABLED`.
- Gemini integration is implemented with `@google/genai`, a shared client, and an injectable `PersonaExtractor`.
- Controlled vocabulary is implemented as a TS taxonomy with server-side validation and `suggestedTags` capture.
- `profiles` module is wired end-to-end in `/v2` using the `friends/` module pattern.
- Implemented routes:
  - `POST /v2/profile/story`
  - `POST /v2/profile/skip`
  - `PUT /v2/profile/tags`
  - `GET /v2/profile/me`
  - `GET /v2/profile/:userId`
- OpenAPI route mirroring is done in `src/v2/docs/openapi.ts`.
- Unit tests for the service/repository seam are in place with a mocked extractor.

### Frontend integrated

- `pulse-web` now has a dedicated persona onboarding screen after signup.
- Signup redirects to onboarding instead of straight to chat.
- Root routing now decides between onboarding and chat based on the current profile state.
- App guards for chat, friends, and nearby routes redirect users into onboarding until the profile is `READY` or `SKIPPED`.
- Frontend API client + types + React Query hooks are implemented for:
  - fetch my profile
  - submit story
  - confirm tags
  - skip onboarding
- Review UI is implemented for story entry, preview tags, confirm, retry, and skip flows.

### Still not integrated

- Friend suggestions (Phase 2).
- Channel tagging / channel suggestions (Phase 3).
- Async/background parsing workflow.
- DB-backed editable taxonomy.
- Full end-to-end browser QA with real Gemini responses across the whole UX.

## Decisions locked

| Decision | Choice | Why |
|---|---|---|
| AI provider | **Google Gemini** | User's choice. |
| Auth | **API key** (`GEMINI_API_KEY`) | User has a key; no Vertex/service-account. |
| Model | **`gemini-2.5-flash`** | Fast, cheap, supports structured JSON output; ample for extraction. Configurable via env. |
| Tag strategy | **Controlled vocabulary** | Tags must match across users for suggestions to work; a fixed taxonomy guarantees that. |
| Timing / UX | **Sync parse → preview → user review → confirm** | User reviews what we collected before it's saved (explicitly requested). Runs on a dedicated endpoint, never inside signup. |

## Flow

```
pulse-web                         pulse-api                              Gemini
   │  free-text story                 │                                     │
   ├──── POST /v2/profile/story ─────▶│                                     │
   │                                  │  save raw story (status=AWAITING_REVIEW)
   │                                  ├──── extractPersona(story) ─────────▶│  gemini-2.5-flash
   │                                  │                                     │  responseSchema (enum-constrained)
   │                                  │◀──── { summary, tags[] } ───────────┤
   │                                  │  validate slugs against taxonomy
   │◀──── preview { summary, tags } ──┤  (off-vocab → suggestedTags bucket)
   │  user edits/confirms (within the allowed vocabulary)
   ├──── PUT /v2/profile/tags ───────▶│  persist confirmed tags (status=READY)
   │◀──── profile ────────────────────┤
```

Why this shape:
- **Never blocks signup.** Signup stays as-is ([auth.controller.ts](../../src/v2/modules/auth/auth.controller.ts));
  the story is a separate, authenticated call. (Signup's cookie maxAge is only ~3 min.)
- **Human-in-the-loop.** The model proposes; the user approves. The stored set is
  always user-confirmed, which is also the cleanest signal for suggestions.
- **Sync is fine here** because it's a dedicated endpoint with a frontend spinner —
  not the auth hot path. (An async background worker is a viable later optimization
  since the server is a single long-lived instance — see [repo-map.md](../repo-map.md#1-server-boot--the-two-express-subtlety).)

## API surface (Phase 1)

All routes require `requireAuth` and (locally) the `/v2` internal gate.

| Method | Path | Body / params | Returns |
|---|---|---|---|
| `POST` | `/v2/profile/story` | `{ story: string }` | `{ summary, tags: TagPreview[], status }` — parsed preview, **not yet final**. |
| `POST` | `/v2/profile/skip` | — | persisted profile, `status: SKIPPED`. |
| `PUT` | `/v2/profile/tags` | `{ tags: string[] }` (slugs ⊂ vocabulary) | persisted profile, `status: READY`. |
| `GET` | `/v2/profile/me` | — | the caller's profile. |
| `GET` | `/v2/profile/:userId` | — | public view of another user's tags. |

Phase 2 adds: `GET /v2/suggestions/friends`, later `GET /v2/suggestions/channels`.

> Remember: mirror every new route into the manual array in
> [`src/v2/docs/openapi.ts`](../../src/v2/docs/openapi.ts) and register the router in
> [`register-routes.ts`](../../src/v2/app/register-routes.ts).

## Data model

New `UserProfile` model (1:1 with `User`) in [`prisma/schema.prisma`](../../prisma/schema.prisma).
Keeping it separate keeps `User` lean and the feature self-contained.

```prisma
model UserProfile {
  id            String        @id @default(auto()) @map("_id") @db.ObjectId
  userId        String        @unique @db.ObjectId
  story         String?       // raw free text the user submitted
  summary       String?       // AI one-line summary (for display)
  tags          String[]      // confirmed, normalized vocabulary slugs — the matching key
  aiTags        String[]      // what the AI proposed (audit / pre-edit)
  suggestedTags String[]      // off-vocabulary candidates → grow the taxonomy later
  traits        Json?         // structured: [{ slug, label, category, confidence }]
  status        ProfileStatus @default(PENDING)
  provider      String?       // "gemini" (audit)
  model         String?       // "gemini-2.5-flash" (audit)
  parsedAt      DateTime?
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  @@index([tags])             // enables hasSome() tag-overlap matching for suggestions
}

enum ProfileStatus {
  PENDING          // no story yet
  SKIPPED          // user explicitly skipped persona onboarding for now
  AWAITING_REVIEW  // parsed, waiting for the user to confirm tags
  READY            // user-confirmed
  FAILED           // AI parse failed; user can retry
}
```

`tags` as an indexed `String[]` makes friend suggestions a one-liner later:
`prisma.userProfile.findMany({ where: { tags: { hasSome: myTags } } })`, ranked by
overlap count.

After editing the schema: `bunx prisma generate && bunx prisma db push`.

## Controlled vocabulary (taxonomy)

The set of allowed tags, grouped by category. **Phase 1: a versioned TS constant**
(`src/v2/modules/profiles/taxonomy.ts`) — simplest, reviewable in PRs. (Later it can
move to a `Tag` collection for admin-managed editing.)

```ts
// shape sketch
export const TAXONOMY = {
  profession:  ["developer", "designer", "teacher", "student", "founder", ...],
  sport:       ["football", "basketball", "running", "gym", ...],
  fandom:      ["cristiano-ronaldo", "messi-fan", "marvel", ...],
  personality: ["extrovert", "introvert", "open-minded", "ambitious", ...],
  media:       ["horror-movies", "anime", "kpop", "gaming", ...],
  lifestyle:   ["early-riser", "traveler", "foodie", "pet-lover", ...],
  values:      ["family-first", "faith", "sustainability", ...],
} as const;
```

Rules:
- The model is told the vocabulary and asked to map the story onto it.
- **Server-side validation is the safety net:** drop any returned slug that isn't in
  `TAXONOMY` from `tags`; park it in `suggestedTags` so the vocabulary can grow from
  real usage over time.
- Slugs are lowercase kebab-case and stable (renaming a slug is a migration).

## Gemini integration

SDK: **`@google/genai`** (the current unified Google Gen AI SDK). Add a thin shared
layer so the client is reused and unit-testable.

```
src/v2/shared/ai/
  gemini.ts            # creates the GoogleGenAI client from env (singleton)
  persona.extractor.ts # extractPersona(story) -> { summary, tags } ; injectable
```

Structured output with an **enum-constrained** schema (Gemini supports `enum` in
`responseSchema`, which is what makes the controlled vocabulary enforceable):

```ts
import { GoogleGenAI } from "@google/genai";
import { env } from "../../config/env";

const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });

const response = await ai.models.generateContent({
  model: env.PERSONA_AI_MODEL,            // "gemini-2.5-flash"
  contents: story,
  config: {
    systemInstruction: PERSONA_SYSTEM_PROMPT, // "map the story onto these tags..."
    responseMimeType: "application/json",
    responseSchema: {
      type: "object",
      properties: {
        summary: { type: "string" },
        tags: {
          type: "array",
          items: {
            type: "object",
            properties: {
              slug:       { type: "string", enum: ALL_VOCABULARY_SLUGS },
              category:   { type: "string", enum: TAXONOMY_CATEGORIES },
              confidence: { type: "number" },
            },
            required: ["slug", "category", "confidence"],
          },
        },
      },
      required: ["summary", "tags"],
    },
  },
});

const parsed = JSON.parse(response.text); // then validate slugs against TAXONOMY
```

Notes:
- If the vocabulary grows large, an `enum` of every slug can get unwieldy — fall back
  to passing the vocabulary in the prompt and relying on **server-side validation**.
  Either way, validate against `TAXONOMY` after parsing.
- Make `extractPersona` an **injected dependency** of the profile repository/service
  so unit tests run without hitting the network (matches the existing DI pattern —
  see [repo-map.md §11](../repo-map.md#11-testing)).
- Wrap failures so a Gemini error becomes `status: FAILED` (and an `AppError` where
  appropriate), never an unhandled 500.

### New env vars (add to [`src/v2/config/env.ts`](../../src/v2/config/env.ts) Zod schema)

| Var | Required | Default | Notes |
|---|---|---|---|
| `GEMINI_API_KEY` | when feature enabled | — | the user's API key. |
| `PERSONA_AI_MODEL` | optional | `gemini-2.5-flash` | configurable model. |
| `PERSONA_AI_ENABLED` | optional | `false` | feature flag (mirrors the `V2_INTERNAL_ENABLED` boolean pattern). |

## Suggestions (Phase 2 — sketch)

Friend suggestions, built on confirmed `tags`:

```ts
// candidates = users sharing ≥1 tag, excluding self / existing friends / blocked
const me = await prisma.userProfile.findUnique({ where: { userId } });
const candidates = await prisma.userProfile.findMany({
  where: {
    userId: { not: userId },
    tags: { hasSome: me.tags },
  },
  take: 200,
});
// score = count of shared tags (optionally weight by category / confidence), sort desc
```

Then filter against `Friendship` / `FriendRequest` / `blockedUserIds` (reuse the
[friends repository](../../src/v2/modules/friends/friends.repository.ts) helpers).
Channel suggestions need channels to carry tags too — a later schema addition.

## Phasing

- **Phase 1 (this plan):** `UserProfile` model + taxonomy + Gemini extractor +
  `profiles` module (story → preview → confirm) + env + OpenAPI + tests.
- **Phase 2:** friend-suggestion endpoint with overlap scoring.
- **Phase 3:** channel tagging + channel suggestions; re-parse/refresh; optional
  async parsing worker; move taxonomy to a DB-backed admin-editable vocabulary.

## Build checklist (Phase 1)

- [x] Add `UserProfile` + `ProfileStatus` to `prisma/schema.prisma`; `generate` + `db push`.
- [x] Add `GEMINI_API_KEY` / `PERSONA_AI_MODEL` / `PERSONA_AI_ENABLED` to `env.ts`.
- [x] `bun add @google/genai`.
- [x] `src/v2/shared/ai/gemini.ts` + `persona.extractor.ts` (injectable).
- [x] `src/v2/modules/profiles/` mirroring [`friends/`](../../src/v2/modules/friends/)
      (routes, controller, service, repository, schema, mapper, types) + `taxonomy.ts`.
- [x] Register router in [`register-routes.ts`](../../src/v2/app/register-routes.ts).
- [x] Mirror routes into [`openapi.ts`](../../src/v2/docs/openapi.ts).
- [x] Unit tests with a mocked extractor (`bun test`).
- [ ] Full repo-wide lint cleanup. The persona feature files are clean, but unrelated pre-existing lint issues still exist elsewhere in the repo.

## Frontend checklist (Phase 1 companion)

- [x] Add frontend API methods and types for profile onboarding.
- [x] Redirect signup into persona onboarding.
- [x] Add a dedicated onboarding page for story → preview → confirm / skip.
- [x] Guard app routes until onboarding is completed or explicitly skipped.
- [x] Add client-side retry/error handling for onboarding fetch + submit flows.
- [ ] Manual browser QA against the live backend using a real Gemini API key.

## Open questions

- Should the user be able to add tags **not** suggested by the AI (any vocabulary
  slug) during review, or only confirm/remove the AI's proposals? (Assumed: confirm/
  remove + add from the allowed vocabulary.)
- Seed the controlled vocabulary — start small and grow from `suggestedTags`, or seed
  a broad list up front?
- Re-onboarding: can a user resubmit a story and re-parse? (Assumed yes; overwrites
  preview, requires re-confirm.)
