# msw-lens — Usage Guide

*How to use what exists today. Installation instructions come when this ships as a package.*

---

## What it does

msw-lens gives you two things:

1. **A scenario switcher.** Flip between MSW mock scenarios without editing files.
   You pick a scenario, msw-lens writes `active-scenarios.ts`, Vite HMR picks it up.
   No browser refresh. No manual file editing.

2. **A context generator.** Point it at a component file, get a ready-to-paste LLM
   prompt that includes the component's full source, its store and type dependencies,
   existing manifests for pattern reference, and a pre-written ask. Paste it into any
   LLM conversation to get scenario suggestions specific to your code.

---

## The commands

```bash
# Switch scenarios interactively
npm run lens

# Stay in the switcher — Ctrl+C to exit
npm run lens:watch

# Generate an LLM prompt for a component
npm run lens:context -- <path/to/component.ts>
```

---

## The switcher

Run `npm run lens` from the project root. You'll see one prompt per discovered endpoint:

```
┌  msw-lens
│
◆  GET /api/user/
│  ● logged-in  Authenticated user with Student and Employee roles
│  ○ logged-out
│  ○ slow
│  ○ server-error
│  ○ admin
└
```

Navigate with arrow keys, confirm with Enter. When you've cycled through all endpoints,
`active-scenarios.ts` is updated and Vite reloads.

`lens:watch` loops back to the top after each pass — useful when you have a single
endpoint open on one side of the screen and the app on the other.

---

## Writing a manifest

Manifests live alongside their handler files in `__mocks__` directories:

```
src/app/__mocks__/
  auth/
    user.ts       ← the MSW handler
    user.yaml     ← the manifest
  cart/
    cart.ts
    cart.yaml
```

A minimal manifest:

```yaml
endpoint: /api/user/
method: GET
shape: document       # document | collection
description: Currently authenticated user profile

scenarios:
  logged-in:
    description: Happy path — authenticated user with expected roles
    active: true      # this scenario is active by default

  logged-out:
    description: Tests that auth guards redirect to login when session is absent
    httpStatus: 401
```

A complete manifest adds type information and sourceHints:

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

**On scenario descriptions:** say what UI behavior the scenario tests, not what the
data looks like. "Tests that the empty cart message appears" is more useful than
"Returns an empty array."

### Scenario vocabulary

**Document endpoints** (single item):
- `happy-path` — successful response with typical data
- `not-found` — 404
- `unauthorized` — 401, tests auth guards
- `server-error` — 500, tests error boundary
- `slow` — `delay: real`, tests loading/skeleton states
- `malformed-data` — missing optional fields or unexpected nulls

**Collection endpoints** (lists):
- `typical` — N items, normal case
- `empty` — zero items, tests empty-state UI
- `overloaded` — far more items than the UI was built for (pagination, overflow)
- `slow` — `delay: real`, tests loading skeleton
- `unauthorized` — 401
- `server-error` — 500

---

## Writing a handler

Handlers live alongside manifests and switch on `activeScenarios`:

```typescript
import { http, HttpHandler, delay, HttpResponse } from 'msw';
import activeScenarios from '../active-scenarios';
import { AuthUser } from '../../areas/shared/util-auth/internal/types';

const loggedInUser: AuthUser = { /* ... */ };

export default [
  http.get('/api/user/', async () => {
    const scenario = activeScenarios['/api/user/'] ?? 'logged-in';

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

Register the handler in `src/app/__mocks__/handlers.ts`:

```typescript
import { HttpHandler } from 'msw';
import authHandler from './auth/user';
import cartHandler from './cart/cart';

export const handlers: HttpHandler[] = [...authHandler, ...cartHandler];
```

---

## The context generator

`lens:context` is for getting an LLM to suggest scenarios for a component you haven't
mocked yet. Point it at the component file you're working on:

```bash
npm run lens:context -- src/app/areas/shopping-cart/shopping-cart.component.ts
```

msw-lens:
1. Reads the component `.ts` and its `.html` template
2. Follows relative imports to find stores, services, and type files
3. Finds existing manifests to use as pattern reference
4. Writes `.msw-lens/prompt.md`

Open `.msw-lens/prompt.md` and paste the entire contents into any LLM conversation.
The prompt is self-contained — the LLM receives:

- Full source of the component and its dependencies (not summaries — the actual files)
- Existing manifests showing the format and vocabulary already in use
- A pre-written ask covering scenarios, handler stub, and registration
- The scenario archetype vocabulary

The LLM will suggest scenarios, write the manifest, write the handler, and flag anything
in the component or template that looks like a gap — missing `@empty` blocks, silent
error swallowing, loading states that don't exist yet.

### The legibility guarantee

Context generation works when the endpoint URL is visible as a literal string in the
crawled source files. If your store uses an injected `HttpClient` with an environment-based
base URL, the tool will include the store source but the resolved URL may not appear in
any of the inlined files. In that case, add the endpoint URL to the prompt manually.

---

## The `.msw-lens/` directory

```
.msw-lens/
  context.md    ← always-current project snapshot; regenerated on every lens run
  prompt.md     ← component-specific LLM prompt; regenerated by lens:context
  README.md     ← explains the directory
```

These files are committed, not gitignored. A new developer (or a new LLM instance)
reading the repo has context immediately — no setup commands required.

**Drop `context.md` into any LLM conversation** to give it instant context about what
is mocked in this project, what scenarios exist, and what is currently active.

---

## What gets written where

| File | Written by | When |
|------|-----------|------|
| `active-scenarios.ts` | lens switcher | every run |
| `.msw-lens/context.md` | lens switcher | every run |
| `.msw-lens/prompt.md` | lens:context | on demand |
| `*.yaml` manifests | developer (or LLM) | once per endpoint |
| `*.ts` handlers | developer (or LLM) | once per endpoint |
