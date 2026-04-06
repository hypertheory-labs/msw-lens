# msw-lens

A developer tool with two jobs:

1. **Scenario switcher** — flip between MSW mock scenarios without editing files. Pick an endpoint, pick a scenario, the app updates via Vite HMR instantly.

2. **Context generator** — crawls a component's imports, inlines the source files an LLM needs, and writes a ready-to-paste prompt. This is the feature that matters most.

## The real point

Every time you start a new AI conversation, it begins cold. No memory of what you built, what decisions you made, or what state the app is in. You become the translator.

msw-lens produces committed artifacts that any AI instance can read and immediately reason about:

- **`active-scenarios.ts`** — what conditions the app is running under right now
- **`.msw-lens/context.md`** — current snapshot of every mocked endpoint and active scenario
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
    "lens": "msw-lens",
    "lens:watch": "msw-lens --watch",
    "lens:context": "msw-lens --context"
  },
  "msw-lens": {
    "mocksDir": "src/__mocks__"
  }
}
```

---

## Commands

```bash
npm run lens                                          # scenario switcher
npm run lens:watch                                    # switcher, Ctrl+C to exit
npm run lens:context -- <path/to/component.ts>        # generate .msw-lens/prompts/<component>.md
```

---

## Demos

This monorepo contains demo apps showing msw-lens working across frameworks — same YAML manifests, same mock layer, different UI.

| App | Framework | Path |
|-----|-----------|------|
| angular-demo | Angular 21 + NgRx Signals | `apps/angular-demo/` |
| react-demo | React + Vite | `apps/react-demo/` *(coming soon)* |
| vue-demo | Vue 3 + Vite | `apps/vue-demo/` *(coming soon)* |

```bash
nx serve angular-demo     # start Angular demo
nx build angular-demo     # build Angular demo
nx build msw-lens         # build the tool
```

---

## The manifest

Manifests are YAML files that live alongside their handler in a `__mocks__` directory:

```
src/__mocks__/
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
  path: src/app/areas/shared/util-auth/internal/types.ts

context:
  sourceHints:
    - src/app/areas/shared/util-auth/store.ts
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
    "./node_modules/@hypertheory-labs/msw-lens/schema/manifest.schema.json": "**/__mocks__/**/*.yaml"
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

Register in `handlers.ts`:

```typescript
import { HttpHandler } from 'msw';
import authHandler from './auth/user';
import cartHandler from './cart/cart';

export const handlers: HttpHandler[] = [
  ...authHandler,
  ...cartHandler,
];
```

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
npm run lens:context -- src/app/features/cart/cart.component.ts
```

msw-lens crawls the component's imports (stores, services, types, templates), finds existing manifests as pattern reference, and writes `.msw-lens/prompts/cart.md`.

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
    "mocksDir": "src/__mocks__",
    "templateExtension": ".html"
  }
}
```

- `mocksDir` — where handlers and manifests live (default: `src/__mocks__`)
- `templateExtension` — sibling template file extension (default: `.html`, set to `null` for React inline JSX)

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
