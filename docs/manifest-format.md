---
title: Manifest format reference
description: Every field in a msw-lens manifest, what it means, and when to use it.
---

A manifest is a YAML file co-located with its MSW handler. The filename doesn't matter; msw-lens discovers manifests by globbing `<mocksDir>/**/*.yaml`.

## Minimum valid manifest

```yaml
endpoint: /api/user/
method: GET
description: Currently authenticated user profile

scenarios:
  logged-in:
    description: Happy path
    active: true
```

Four required fields: `endpoint`, `method`, `description`, and `scenarios` (with at least one scenario defined).

## Complete manifest

```yaml
# yaml-language-server: $schema=https://unpkg.com/@hypertheory-labs/msw-lens/schema/manifest.schema.json

endpoint: /api/user/
method: GET
shape: document
description: Currently authenticated user profile

responseType:
  name: AuthUser
  path: src/auth/types.ts

errorType:
  name: ProblemDetails
  path: src/shared/problem-details.ts

context:
  sourceHints:
    - src/auth/auth-store.ts
    - src/layout/header.ts
  hints:
    - "401 always redirects to /login via the auth guard"
    - "The header component shows the avatar; missing data means a fallback initial"

scenarios:
  logged-in:
    description: Authenticated user with Student and Employee roles — the happy path
    active: true

  logged-out:
    description: No session — tests that auth guards redirect and login UI appears
    httpStatus: 401

  slow:
    description: Sluggish auth service — tests loading skeleton in consuming components
    delay: real

  server-error:
    description: Auth service unavailable — tests error boundary or fallback UI
    httpStatus: 500
```

## Fields

### `endpoint` (required)

The URL path or full URL the handler intercepts. Match exactly what your handler registers with `http.get(...)`.

```yaml
endpoint: /api/cart              # relative path
endpoint: https://api.example.com/v1/user   # absolute URL
endpoint: /cart/:id              # with path params
```

### `method` (required)

HTTP method in uppercase: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`. Used as part of the scenario lookup key (`"GET /api/cart"`), which lets the same endpoint carry different scenarios per method.

### `shape` (optional)

One of `document` or `collection`. Hints at what scenario vocabulary is appropriate:

- `document` — single-item response (user, product, order). Scenarios like `happy-path`, `not-found`, `unauthorized`.
- `collection` — array or paginated list. Scenarios like `typical`, `empty`, `overloaded`.

Mutations (POST/PUT/PATCH/DELETE) usually omit `shape` — they have their own scenario vocabulary (see [Scenario archetypes](./scenario-archetypes)).

### `description` (required)

One-line summary of what this endpoint returns. Show up at the top of generated context; shown in the TUI.

### `responseType` (optional but recommended)

Points at the TypeScript type of a successful response:

```yaml
responseType:
  name: Cart
  path: src/types.ts
```

Inlined into `lens:context` prompts. Lets an AI generating new scenarios use your real type rather than inventing one.

### `errorType` (optional)

Points at your error response type — typically [RFC 9457 `ProblemDetails`](https://datatracker.ietf.org/doc/html/rfc9457) or similar:

```yaml
errorType:
  name: ProblemDetails
  path: src/shared/problem-details.ts
```

Relevant for mutation endpoints where validation errors carry structured field data.

### `context.sourceHints` (optional)

Paths to files that *consume* this endpoint. Stores, services, hooks, components. When `lens:context` runs, these get inlined alongside the component the user pointed at. The LLM reads them to understand the endpoint's role.

```yaml
context:
  sourceHints:
    - src/features/cart/cart-store.ts
    - src/features/cart/Cart.tsx
```

**Paths, not summaries.** An LLM reading the real source finds things a summary would miss. Your job is to point at files, not to describe them.

### `context.hints` (optional)

Free-form notes for an LLM reading the manifest. Use sparingly — prefer source hints. Useful when there's a hidden invariant the source alone wouldn't reveal:

```yaml
context:
  hints:
    - "401 always redirects to /login via the auth guard"
    - "The 'slow' scenario is load-bearing for exercising the loading skeleton"
```

### `scenarios` (required)

A map of scenario name → scenario definition. At least one scenario must be defined. Exactly one scenario should have `active: true` (this is the default when the app boots before any `lens` run).

### Scenario fields

```yaml
scenarios:
  scenario-name:
    description: What UI behavior this tests   # required
    active: true                                # optional; marks the default
    httpStatus: 401                             # optional; for error responses
    delay: real                                 # optional; MSW delay mode
```

- **`description`** (required) — what UI behavior this scenario tests. See [the one rule](#the-one-rule-for-scenario-descriptions).
- **`active`** — exactly one scenario should have `active: true`. Used as fallback when `active-scenarios.ts` has no entry yet.
- **`httpStatus`** — the HTTP status code. Used for error scenarios. When absent, handlers typically return 200.
- **`delay`** — an [MSW delay mode](https://mswjs.io/docs/api/delay/). One of: `real` (realistic network latency), `infinite` (request never resolves — tests timeout/loading-stuck UI), or a number in milliseconds (passed as a string, e.g. `"2000"`).

## The one rule for scenario descriptions

Say what UI behavior the scenario tests — not what the data looks like.

- ✅ `"Tests that the empty cart message appears and the checkout button disables"`
- ❌ `"Returns an empty items array"`

This matters because descriptions end up in `context.md` and in generated prompts. A description that captures intent is worth ten times more than one that describes the response shape. Intent tells an AI *why* the scenario exists and what to look for when verifying it.
