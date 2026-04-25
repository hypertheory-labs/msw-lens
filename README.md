# msw-lens

A developer tool with two jobs:

1. **Scenario switcher** — flip between MSW mock scenarios without editing files. Pick an endpoint, pick a scenario, the app updates via Vite HMR instantly.

2. **Context generator** — crawls a component's imports, inlines the source files an LLM needs, and writes a ready-to-paste prompt. This is the feature that matters most.

## The real point

Every time you start a new AI conversation, it begins cold. No memory of what you built, what decisions you made, or what state the app is in. You become the translator.

msw-lens produces committed artifacts that any AI instance can read and immediately reason about:

- **`active-scenarios.ts`** — which scenario is active per endpoint
- **`bypassed-endpoints.ts`** — endpoints currently bypassing MSW (real-network passthrough)
- **`.msw-lens/context.md`** — current snapshot of every mocked endpoint, active scenario, and bypass status
- **`.msw-lens/prompts/<component>.md`** — ready-to-paste prompt for getting scenario suggestions

Drop `context.md` into any conversation. That instance knows what's mocked, what scenarios exist, what's active, and where the source files are. No narration required.

The manifests do the same at a finer grain — one YAML file is useful to the switching tool, useful to you, and useful to an AI. Same artifact, three consumers.

**Design for AI legibility first. Human legibility comes almost for free.**

---

## Installation

```bash
npm install --save-dev @hypertheory-labs/msw-lens
```

Add to your `package.json`:

```json
{
  "scripts": {
    "lens:init": "msw-lens --init",
    "lens": "msw-lens",
    "lens:watch": "msw-lens --watch",
    "lens:context": "msw-lens --context"
  }
}
```

The `msw-lens` config block is optional. If your MSW handlers live in `src/mocks/` (MSW's recommended layout) it's zero-config. See [Configuration](#framework-configuration) if you need to point at a different directory.

Run `npm run lens:init` once after install to bootstrap msw-lens's tool-owned files. It creates `active-scenarios.ts` and `bypassed-endpoints.ts` (both empty), regenerates `.msw-lens/context.md`, and prints a setup checklist. Idempotent — re-running it leaves existing files alone.

### MSW prerequisite for bypass

For the bypass feature to pass through to real APIs (rather than warn or error), start MSW with `onUnhandledRequest: 'bypass'`:

```typescript
worker.start({ onUnhandledRequest: 'bypass' });
```

This is conventional MSW configuration anyway — mock what you intend to mock, real-network everything else.

---

## Commands

```bash
npm run lens:init                                     # bootstrap tool-owned files (run once)
npm run lens                                          # scenario switcher
npm run lens:watch                                    # switcher, Ctrl+C to exit
npm run lens:context -- <path/to/component.ts>        # generate .msw-lens/prompts/<component>.md
```

The switcher's scenario picker offers `bypass — pass through to real API` per endpoint alongside the manifest's declared scenarios. Picking bypass filters the handler out of MSW registration entirely; requests reach the real network. Pick any other scenario to restore mocking.

---

## Demos

This monorepo contains demo apps showing msw-lens working across frameworks — same YAML manifests, same mock layer, different UI.

| App | Framework | Status |
|-----|-----------|--------|
| `apps/angular-demo/` | Angular 21 + Tailwind + DaisyUI | working |
| `apps/react-demo/` | Vite + React 19 + Tailwind + DaisyUI | working |
| `apps/vue-demo/` | Vue 3 + Vite | planned |

```bash
nx serve angular-demo     # dev server
nx build angular-demo     # production build
npm run build:lens        # build the package itself
```

---

## The manifest

Manifests are YAML files that live alongside their handler. The default layout is `src/mocks/` (MSW's convention), but you can point msw-lens anywhere:

```
src/mocks/
  auth/
    user.ts       ← MSW handler
    user.yaml     ← manifest
  cart/
    cart.ts
    cart.yaml
    cart-patch.ts
    cart-patch.yaml
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

A complete manifest:

```yaml
endpoint: /api/user/
method: GET
shape: document
description: Currently authenticated user profile

responseType:
  name: AuthUser
  path: src/auth/types.ts

context:
  sourceHints:
    - src/auth/auth-store.ts
  hints:
    - "401 always redirects to /login via the auth guard"

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
```

### VS Code schema support

Install the [Red Hat YAML extension](https://marketplace.visualstudio.com/items?itemName=redhat.vscode-yaml) and add to `.vscode/settings.json`:

```json
{
  "yaml.schemas": {
    "./node_modules/@hypertheory-labs/msw-lens/schema/manifest.schema.json": "**/mocks/**/*.yaml"
  }
}
```

Or add a modeline to each manifest (no settings required):

```yaml
# yaml-language-server: $schema=https://unpkg.com/@hypertheory-labs/msw-lens/schema/manifest.schema.json
endpoint: /api/user/
```

Gives you autocomplete, hover docs, and soft validation on all manifest files.

---

## The one rule for scenario descriptions

Say what UI behavior the scenario tests — not what the data looks like.

- `"Tests that the empty cart message appears and the checkout button disables"` — good
- `"Returns an empty array"` — not useful

This matters because descriptions end up in `context.md` and in generated prompts. A description that captures intent is worth ten times more than one that describes the response shape.

---

## Writing a handler

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

Key: `"GET /api/user/"` not `"/api/user/"`. Multiple methods on the same endpoint (PATCH and DELETE on `/cart/:id`) need the method prefix to avoid collisions.

Register in `handlers.ts` with the bypass filter:

```typescript
import { HttpHandler } from 'msw';
import authHandler from './auth/user';
import cartHandler from './cart/cart';
import bypassed from './bypassed-endpoints';

const all: HttpHandler[] = [...authHandler, ...cartHandler];

export const handlers: HttpHandler[] = all.filter((h) => {
  const { method, path } = h.info;
  if (typeof method !== 'string' || typeof path !== 'string') return true;
  return !bypassed.has(`${method} ${path}`);
});
```

`bypassed-endpoints.ts` is tool-owned (msw-lens writes it). The filter removes bypassed endpoints from MSW registration entirely so matching requests pass through to the real network — see the [MSW prerequisite](#msw-prerequisite-for-bypass) above.

### Mutation handlers

Mutations are stateless — the scenario controls what the handler *returns*, not shared state. The store handles optimistic updates; the mock controls which result path to exercise.

```typescript
http.patch('https://api.example.com/cart/:id', async () => {
  const scenario = activeScenarios['PATCH https://api.example.com/cart/:id'] ?? 'success';

  switch (scenario) {
    case 'validation-error':
      return HttpResponse.json(
        { type: '...', title: 'Invalid', status: 422, detail: '...' },
        { status: 422 }
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

Add `errorType` to the manifest pointing at your error type (RFC 9457 `ProblemDetails` or equivalent) — an AI reading the manifest will use it to generate realistic error bodies.

---

## The context generator

```bash
npm run lens:context -- src/features/cart/Cart.tsx
```

Works with `.ts`, `.tsx`, `.js`, and `.jsx` entry files. Angular components with separate `.html` templates are picked up via the `templateExtension` option (see below).

msw-lens crawls the component's imports (stores, services, types, templates), finds existing manifests as pattern reference, and writes `.msw-lens/prompts/Cart.md`.

Paste the whole file into any AI conversation to get:
- Scenario suggestions with UI-behavior descriptions
- A manifest YAML per endpoint
- A handler stub with switch statement
- Gap analysis — things the AI noticed in your source that you didn't ask about

The AI reading your actual source finds things a summary would miss: null vs empty array, missing error handling, buttons with no pending state. These aren't things a persona prompt surfaces. They come from having the real code.

### Framework configuration

```json
{
  "msw-lens": {
    "mocksDir": "src/mocks",
    "templateExtension": ".html"
  }
}
```

- `mocksDir` — where handlers and manifests live (default: `src/mocks`, matching MSW's conventional layout). Override if your mocks live elsewhere (e.g. `apps/web/src/mocks` in a monorepo, or `src/__mocks__` if you prefer that convention).
- `templateExtension` — sibling template file extension for frameworks that separate template from logic (e.g. `".html"` for Angular components using `templateUrl`). Default is `null` — inline-template frameworks (React, Svelte, Vue with `<template>` inside the SFC) work zero-config.

---

## The `.msw-lens/` directory

```
.msw-lens/
  context.md          ← always-current project snapshot; regenerated on every lens run
  prompts/
    cart.md           ← component-specific prompt; regenerated by lens:context
  README.md           ← explains the directory
```

**These files are committed, not gitignored.** A new developer, a CI environment, or an AI instance starting fresh can read `context.md` and immediately know what's mocked, what scenarios exist, and what's active. No setup required.

---

## The two-universe model

msw-lens creates a handoff point between separate AI sessions:

```
Universe 1 (your session)          Universe 2 (any model, any session)
─────────────────────────          ───────────────────────────────────
npm run lens:context            →  receives .msw-lens/prompts/cart.md
  crawls your actual source         reads the real TypeScript + templates
  finds the endpoints               identifies what scenarios make sense
  inlines the files                 writes the manifest YAML
  writes the prompt                 writes the handler stub
                                    flags gaps you didn't ask about
```

The prompt is the artifact. The model is interchangeable. Same prompt works with Claude, GPT-4, Gemini, or whatever comes next.

---

## Related

- [Stellar Devtools](https://stellar.hypertheory-labs.dev) — observes app state, records causal chains (click → HTTP → state change), exports as AI-readable markdown. Stellar = observe. msw-lens = control. Together they give an AI everything it needs to generate meaningful Playwright tests.
