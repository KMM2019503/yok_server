# Profile API for Frontend

This is the frontend contract for the unified profile flow in `/v2`.

Use this doc when building:
- onboarding story submission
- tag review / confirmation
- editable account/profile screen
- public profile display

## Base setup

- Base path: `/v2`
- Live docs:
  - `GET /docs`
  - `GET /openapi.json`
- Auth for all profile endpoints:
  - cookie auth via the `token` cookie
  - internal gate header: `x-internal-v2-token` when enabled in the environment
- Frontend fetch should send cookies:

```ts
fetch("/v2/profile/me", {
  method: "GET",
  credentials: "include",
  headers: {
    "x-internal-v2-token": INTERNAL_TOKEN,
  },
});
```

## Response shapes

Dates are serialized as ISO strings in JSON.

### `ProfileTag`

```json
{
  "slug": "developer",
  "label": "Developer",
  "category": "profession",
  "confidence": 0.92
}
```

### `GET /v2/profile/me` and `PUT /v2/profile/me`

```json
{
  "success": true,
  "user": {
    "id": "6860...",
    "email": "user@example.com",
    "userName": "Alex",
    "userUniqueID": "A#1234",
    "gender": "M",
    "dateOfBirth": "1998-05-10T00:00:00.000Z",
    "profilePictureUrl": "https://example.com/avatar.jpg",
    "lastActiveAt": "2026-06-28T08:30:00.000Z",
    "createdAt": "2026-06-01T10:00:00.000Z",
    "updatedAt": "2026-06-28T09:00:00.000Z"
  },
  "profile": {
    "userId": "6860...",
    "story": "I'm a developer and I love football.",
    "summary": "A developer who enjoys football.",
    "status": "READY",
    "tags": [
      {
        "slug": "developer",
        "label": "Developer",
        "category": "profession",
        "confidence": 1
      }
    ],
    "confirmedTagSlugs": ["developer", "football"],
    "aiTagSlugs": ["developer", "football"],
    "suggestedTags": [],
    "parsedAt": "2026-06-28T09:00:00.000Z",
    "createdAt": "2026-06-28T09:00:00.000Z",
    "updatedAt": "2026-06-28T09:01:00.000Z"
  }
}
```

If the user has not created a persona profile yet, `profile` is `null` but `user` is still returned.

### `GET /v2/profile/:userId`

```json
{
  "success": true,
  "user": {
    "id": "6860...",
    "userName": "Alex",
    "userUniqueID": "A#1234",
    "profilePictureUrl": "https://example.com/avatar.jpg",
    "lastActiveAt": "2026-06-28T08:30:00.000Z"
  },
  "profile": {
    "userId": "6860...",
    "summary": "A developer who enjoys football.",
    "tags": [
      {
        "slug": "developer",
        "label": "Developer",
        "category": "profession",
        "confidence": 1
      }
    ],
    "updatedAt": "2026-06-28T09:01:00.000Z"
  }
}
```

## Profile status values

- `PENDING`: no story submitted yet
- `AWAITING_REVIEW`: story parsed, waiting for tag confirmation
- `READY`: confirmed and usable
- `SKIPPED`: user skipped onboarding
- `FAILED`: story parsing failed

## Endpoints

### `GET /v2/profile/me`

Returns the authenticated user's editable account info plus persona profile state.

Use this for:
- initial load of settings/profile screen
- deciding whether to show onboarding
- refreshing after any profile mutation

### `PUT /v2/profile/me`

Unified update endpoint for both account info and persona data.

Accepted body fields:

```json
{
  "userName": "Alex",
  "email": "alex@example.com",
  "profilePictureUrl": "https://example.com/avatar.jpg",
  "gender": "M",
  "dateOfBirth": "1998-05-10",
  "story": "I'm a developer and I love football.",
  "tags": ["developer", "football"]
}
```

Notes:
- Every field is optional, but at least one field must be provided.
- `profilePictureUrl` can be `null` to clear it.
- `gender` can be `null` to clear it.
- `dateOfBirth` can be a date string, or you can send legacy `dob`.
- `story` must be 10 to 4000 characters.
- `tags` must be 1 to 30 lowercase kebab-case slugs.
- If you send both `story` and `tags`, the backend will:
  - update user fields
  - parse the story
  - confirm the provided tags
  - return the latest profile

Recommended frontend usage:
- edit basic user info only: send user fields
- onboarding step 1: send `story`
- onboarding step 2: send `tags`
- one-shot save after review: send both `story` and `tags`

### `POST /v2/profile/story`

Body:

```json
{
  "story": "I'm a developer, I love football, and I enjoy horror movies."
}
```

Returns the same response shape as `GET /v2/profile/me`, usually with:
- `profile.status = "AWAITING_REVIEW"`
- AI-generated `summary`
- preview `tags`
- `confirmedTagSlugs = []`

Use this when the frontend has a dedicated story submission step.

### `PUT /v2/profile/tags`

Body:

```json
{
  "tags": ["developer", "football", "horror-movies"]
}
```

Returns the same response shape as `GET /v2/profile/me`, usually with:
- `profile.status = "READY"`
- `confirmedTagSlugs` filled

Use this after showing the preview tags to the user.

Important:
- this requires an existing parsed profile
- if the user has not submitted a story yet, this returns `400`

### `POST /v2/profile/skip`

No body.

Returns the same response shape as `GET /v2/profile/me`, with:
- `profile.status = "SKIPPED"`
- cleared story / summary / tags

### `GET /v2/profile/:userId`

Returns the public profile for another user.

Important:
- only `READY` profiles are visible
- if the target profile is not ready, this returns `404`

## Error format

Most `/v2` profile errors follow:

```json
{
  "error": "Human-readable message",
  "details": []
}
```

Common cases:
- `400` invalid payload, invalid tag slug, or confirming tags before a story exists
- `401` missing/invalid auth cookie
- `403` missing/invalid internal token when the gate is enabled
- `404` public profile not found / not ready
- `409` email already in use
- `502` AI parsing failed
- `503` persona AI feature disabled

## Suggested frontend flows

### Onboarding

1. `GET /v2/profile/me`
2. If `profile` is `null` or status is `PENDING`, show story step
3. `POST /v2/profile/story`
4. Show preview tags
5. `PUT /v2/profile/tags`

### Settings / edit profile

1. `GET /v2/profile/me`
2. Save basic info with `PUT /v2/profile/me`
3. If the story changes, also send `story`
4. If the user confirms changed tags, send `tags` too

## Recommendation

For new frontend work, prefer `PUT /v2/profile/me` over the legacy `/v2/users/update` route when editing the user's own profile screen. Use the older route only where legacy screens still depend on it.
