# msw-lens — Guide

*A developer tool for Angular apps using MSW. Built on a simple idea that turns out to go pretty deep.*

---

## The real point

msw-lens is a tool for switching mock scenarios. But that's the mechanism, not the point.

The point is **AI communication**.

Every time you start a new conversation with an AI assistant, it begins cold. No memory of what you built, what decisions you made, or what state the app is in right now. You become the translator — describing the codebase in English, hoping the AI can reason about something it can't see.

msw-lens is one half of a solution to that problem. It produces structured, committed artifacts that any AI instance can read and immediately reason about:

- **`active-scenarios.ts`** — what conditions the app is running under right now
- **`.msw-lens/context.md`** — a current snapshot of every mocked endpoint and its active scenario
- **`.msw-lens/prompt.md`** — a ready-to-paste brief for getting scenario suggestions on a specific component

Drop `context.md` into any AI conversation. That AI knows what's mocked, what scenarios exist, what's currently active, and where the relevant source files are. No narration required.

The manifests do the same thing at a finer grain. A YAML file that says:

```yaml
description: Tests that auth guards redirect correctly and login UI appears
httpStatus: 401
```

is useful to the switching tool (reads `httpStatus`), useful to you (reads `description`), and useful to an AI (reads both and understands the relationship). Same artifact, three consumers.

**Design for AI legibility first. Human legibility comes almost for free.**

---

## What it does

Two features:

### 1. Scenario switcher

Flip between MSW mock scenarios without editing files. Run `npm run lens`, pick an endpoint, pick a scenario. msw-lens writes `active-scenarios.ts`. Vite HMR picks it up instantly. No browser refresh, no file editing.

```
┌  msw-lens ─────────────────────────────────────────────────────────
│
◇  Which endpoint?
│  ○ GET /api/user/                                    [logged-in]
│  ○ GET https://store.company.com/user/cart           [typical]
│  ○ PATCH https://store.company.com/user/cart/:id     [success]
│  ○ DELETE https://store.company.com/user/cart/:id    [success]
└
```

Select an endpoint, pick a scenario, the app updates immediately. Changes write on every selection — not at the end.

### 2. Context generator

Point it at a component file, get a ready-to-paste AI prompt:

```bash
npm run lens:context -- src/app/areas/shopping-cart/cart.ts
```

msw-lens crawls the component's imports (stores, types, templates), finds existing manifests as pattern reference, and writes `.msw-lens/prompt.md`. Paste the whole thing into any AI conversation to get scenario suggestions, a manifest, a handler stub, and — because the AI is reading your actual source — observations about gaps in the component you didn't know to ask about.

---

## Commands

```bash
npm run lens                                        # scenario switcher
npm run lens:watch                                  # switcher, Ctrl+C to exit
npm run lens:context -- <path/to/component.ts>      # generate .msw-lens/prompt.md
```

---

## The manifest

Manifests are YAML files that live alongside their handler in a `__mocks__` directory:

```
src/app/__mocks__/
  auth/
    user.ts       ← MSW handler
    user.yaml     ← manifest
  cart/
    cart.ts
    cart.yaml
    cart-patch.ts
    cart-patch.yaml
    cart-delete.ts
    cart-delete.yaml
```

A minimal manifest:

```yaml
endpoint: /api/user/
method: GET
description: Currently authenticated user profile

scenarios:
  logged-in:
    description: Authenticated user — the happy path
    active: true

  logged-out:
    description: No session — tests that auth guards redirect correctly
    httpStatus: 401
```

A complete manifest adds type information and source hints:

```yaml
endpoint: /api/user/
method: GET
shape: document
description: Currently authenticated user profile

responseType:
  name: AuthUser
  path: src/app/areas/shared/util-auth/internal/types.ts

context:
  sourceHints:
    - src/app/areas/shared/util-auth/store.ts
    - src/app/areas/shared/util-auth/internal/types.ts

scenarios:
  logged-in:
    description: Authenticated user with Student and Employee roles — the happy path
    active: true

  logged-out:
    description: No session — tests that auth guards redirect correctly and login UI appears
    httpStatus: 401

  slow:
    description: Sluggish auth service — tests loading skeleton states in consuming components
    delay: real

  server-error:
    description: Auth service unavailable — tests error boundary or fallback UI
    httpStatus: 500

  admin:
    description: Elevated Admin role — tests role-based UI variations (nav items, gated features)
```

### The one rule for scenario descriptions

Say what UI behavior the scenario tests — not what the data looks like.

- "Tests that the empty cart message appears" — good
- "Returns an empty array" — not useful

This matters because the descriptions end up in `context.md`, in `prompt.md`, and eventually as input to AI-generated test scaffolding. A description that captures intent is worth ten times more than one that describes the response shape.

### Scenario vocabulary

**GET — document** (single item):
- `happy-path` / `logged-in` / `typical` — successful, representative response
- `not-found` — 404
- `unauthorized` — 401, tests auth guards
- `server-error` — 500, tests error boundary
- `slow` — `delay: real`, tests loading states
- `malformed-data` — unexpected nulls or missing optional fields

**GET — collection** (list):
- `typical` — N items, normal case
- `empty` — zero items, tests empty-state UI
- `large` — far more items than designed for, tests overflow or pagination
- `slow` — `delay: real`
- `unauthorized` — 401
- `server-error` — 500

**Mutations** (POST, PATCH, DELETE):
- `success` — happy path (active by default)
- `validation-error` — 400, tests field-level error display
- `conflict` — 409, tests UI response to state conflicts
- `server-error` — 500, tests whether optimistic updates roll back
- `slow` — `delay: real`, tests pending states on buttons

---

## Writing a handler

Handlers switch on `activeScenarios` using `"METHOD endpoint"` as the key:

```typescript
import { http, HttpHandler, HttpResponse, delay } from 'msw';
import activeScenarios from '../active-scenarios';

const ENDPOINT = '/api/user/';

export default [
  http.get(ENDPOINT, async () => {
    const scenario = activeScenarios[`GET ${ENDPOINT}`] ?? 'logged-in';

    switch (scenario) {
      case 'logged-out':
        return new HttpResponse(null, { status: 401 });
      case 'slow':
        await delay('real');
        return HttpResponse.json(loggedInUser);
      case 'server-error':
        return new HttpResponse(null, { status: 500 });
      case 'logged-in':
      default:
        return HttpResponse.json(loggedInUser);
    }
  }),
] as HttpHandler[];
```

Note the key format: `"GET /api/user/"` not `"/api/user/"`. This matters when you have multiple methods on the same endpoint (PATCH and DELETE on `/cart/:id` would otherwise collide).

Register in `handlers.ts`:

```typescript
import { HttpHandler } from 'msw';
import authHandler from './auth/user';
import cartHandler from './cart/cart';
import cartPatchHandler from './cart/cart-patch';
import cartDeleteHandler from './cart/cart-delete';

export const handlers: HttpHandler[] = [
  ...authHandler,
  ...cartHandler,
  ...cartPatchHandler,
  ...cartDeleteHandler,
];
```

### Mutation handlers

Mutations are stateless — the scenario controls what the handler *returns*, not shared state. This is intentional. msw-lens scenarios exist to test UI behavior, not simulate a backend. The store handles optimistic updates; the mock controls which result path to exercise.

For PATCH/DELETE that return no body:

```typescript
http.patch('https://store.company.com/user/cart/:id', async () => {
  const scenario = activeScenarios['PATCH https://store.company.com/user/cart/:id'] ?? 'success';

  switch (scenario) {
    case 'validation-error':
      return HttpResponse.json(
        { type: '...', title: 'Invalid quantity', status: 400, detail: '...' },
        { status: 400 }
      );
    case 'server-error':
      return new HttpResponse(null, { status: 500 });
    case 'slow':
      await delay('real');
      return new HttpResponse(null, { status: 202 });
    case 'success':
    default:
      return new HttpResponse(null, { status: 202 });
  }
}),
```

Add an `errorType` field to the manifest pointing at your error envelope type (RFC 9457 `ProblemDetails` or equivalent). An AI reading the manifest will use that type to generate realistic error response bodies — you don't need to enumerate them in the manifest.

```yaml
errorType:
  name: ProblemDetails
  path: src/app/areas/shared/util-types/problem-details.ts
```

### Handlers outside msw-lens

For handlers you don't want msw-lens to manage — stateful mocks, third-party endpoints, mutations with shared in-memory state — use a single extension point:

```
__mocks__/
  custom/
    index.ts    ← default export: HttpHandler[]
```

Compose in `handlers.ts` with custom handlers *before* lens-managed handlers:

```typescript
import customHandlers from './custom';
export const handlers = [...customHandlers, ...lensHandlers];
```

Custom handlers win by position. No before/after complexity needed.

---

## The `.msw-lens/` directory

```
.msw-lens/
  context.md    ← always-current project snapshot; regenerated on every lens run
  prompt.md     ← component-specific AI prompt; regenerated by lens:context
  README.md     ← explains the directory to anyone who opens the repo
```

**These files are committed, not gitignored.** That's not an accident.

A new developer joining the project, a CI environment, or an AI instance starting a fresh session — any of them can read `context.md` and immediately know what's mocked, what scenarios exist, and what's active. No setup, no explanation needed.

### When does `context.md` update?

Every time you run `lens` (the switcher). Switch a scenario, it regenerates. That means it always reflects the current active state — whoever reads it next, human or AI, gets an accurate picture.

It does *not* update when `active-scenarios.ts` is edited manually (you shouldn't anyway — the tool owns that file). If that happens, `context.md` drifts until the next `lens` run. This is an acceptable tradeoff: the tool owns the file, so if the tool ran last, the file is current.

---

## The two-universe model

This is the part that's hardest to see until you've experienced it — and then it's hard to unsee.

msw-lens creates a handoff point between two completely separate AI sessions:

```
Universe 1 (your session)          Universe 2 (any model, any session)
─────────────────────────          ───────────────────────────────────
npm run lens:context            →  receives .msw-lens/prompt.md
  crawls your actual source         reads the real TypeScript + templates
  finds the endpoints               identifies what scenarios make sense
  inlines the files                 writes the manifest YAML
  writes prompt.md                  writes the handler stub
                                    flags gaps you didn't ask about
```

`.msw-lens/prompt.md` is the portal. You generate it in your session; you paste it into any conversation with any model. That model receives your actual source code, your existing manifests as pattern reference, and a pre-written ask — and it has everything it needs to produce something useful without any further explanation from you.

This works with Claude. It works with GPT-4. It works with whatever comes next. The prompt is the artifact; the model is interchangeable.

### The cross-model feedback loop

Because `prompt.md` is a committed file you can hand to any model, you can test it across models deliberately:

1. Give `prompt.md` to Model A — see what it produces
2. Ask Model A: *"What would have helped you that wasn't in this prompt?"*
3. Give `prompt.md` to Model B — same question
4. The gaps that show up across *all* models are real gaps in the format
5. Improve `generate-prompt.ts` — every future `lens:context` run gets the fix

The AI becomes a participant in improving its own context. You're not just asking "did it work?" — you're asking "what did you need?" That's a different conversation, and a more useful one.

---

## The bigger picture

msw-lens + Stellar form a feedback loop that an AI can fully participate in:

- **Stellar** observes app state: records causal chains from user action → HTTP request → state change, exportable as AI-readable markdown
- **msw-lens** controls mock conditions: sets which scenario each endpoint is running under

Together, they give an AI everything it needs to generate meaningful Playwright tests:

1. msw-lens manifest → the setup (which scenario) and the assertion spec (scenario description)
2. Stellar recording → the action (what the user did) and the evidence (what state actually changed)

An AI reading both doesn't generate boilerplate — it generates tests that know what they're testing and why. And when the component doesn't handle a failure case, the test it writes will *fail* — which is exactly the right outcome.

This is the feedback loop made complete: set the condition, act, observe, test. The manifests you write today are the test specs for tomorrow.
