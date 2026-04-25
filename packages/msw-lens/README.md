# msw-lens

A developer tool for projects that use [MSW](https://mswjs.io/). Two jobs:

1. **Scenario switcher** — flip between mock scenarios without editing handler files. Pick an endpoint, pick a scenario, the app updates via Vite HMR instantly.
2. **Context generator** — crawl a component's imports, inline the source files an LLM needs, and write a ready-to-paste prompt.

The switcher is real and useful. The context generator is why the tool exists.

## The real point

Every time you start a new AI conversation about your app, it begins cold. No memory of what you built or what state the app is running under. You become the translator.

msw-lens produces **committed artifacts** that any AI instance can read and reason about immediately:

- `src/mocks/active-scenarios.ts` — which scenario is active per endpoint
- `src/mocks/bypassed-endpoints.ts` — endpoints currently bypassing MSW (real-network passthrough)
- `.msw-lens/context.md` — a snapshot of every mocked endpoint, active scenario, and bypass status
- `.msw-lens/prompts/<component>.md` — a ready-to-paste prompt with the real source inlined

Drop `context.md` into any conversation. That instance knows what's mocked, what's active, and where the source lives. No narration required.

**The manifest is the prompt.** The same YAML is useful to the switcher, useful to you, and useful to an AI. One artifact, three consumers.

## Install

```bash
npm install --save-dev @hypertheory-labs/msw-lens
```

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

Zero-config if your MSW handlers live in `src/mocks/` (MSW's default). Otherwise add a `msw-lens` block pointing at your mocks directory — see [Configuration](https://github.com/hypertheory-labs/msw-lens/blob/main/docs/manifest-format.md).

Run `npm run lens:init` once after install to bootstrap the tool-owned files.

### MSW prerequisite for bypass

For the bypass option to pass through to real APIs, start MSW with `onUnhandledRequest: 'bypass'`:

```typescript
worker.start({ onUnhandledRequest: 'bypass' });
```

This is conventional MSW dev configuration — mock what you intend to mock, real-network everything else.

## Commands

```bash
npm run lens:init                                     # bootstrap tool-owned files (run once)
npm run lens                                          # interactive scenario switcher
npm run lens:watch                                    # stay in switcher, Ctrl+C to exit
npm run lens:context -- <path/to/component.ts>        # generate an LLM prompt
```

The switcher's scenario picker offers `bypass — pass through to real API` per endpoint. Picking it filters the handler out of MSW registration so requests reach the real network. Pick any other scenario to restore mocking.

## Minimum viable manifest

```yaml
# yaml-language-server: $schema=https://unpkg.com/@hypertheory-labs/msw-lens/schema/manifest.schema.json

endpoint: /api/cart
method: GET
description: User's shopping cart

scenarios:
  typical:
    description: Cart has items — renders the list, enables checkout
    active: true

  empty:
    description: Zero items — tests the empty-cart message and disabled Checkout
```

Co-located with your MSW handler. Handler reads the active scenario and switches. Full reference: [manifest format docs](https://github.com/hypertheory-labs/msw-lens/blob/main/docs/manifest-format.md).

## The two-universe model

msw-lens creates a handoff point between separate AI sessions:

```
Universe 1 (your session)          Universe 2 (any model, any session)
─────────────────────────          ───────────────────────────────────
npm run lens:context            →  receives .msw-lens/prompts/cart.md
  crawls your actual source         reads the real TypeScript + templates
  finds the endpoints               identifies what scenarios make sense
  inlines the files                 writes manifest + handler + gap analysis
```

The prompt is the artifact. The model is interchangeable. The conversation isn't durable; the YAML is.

## Demos

This repo contains demo apps showing msw-lens working across frameworks — same manifest format, different UI.

| App | Framework | Status |
|-----|-----------|--------|
| `apps/angular-demo/` | Angular 21 + Tailwind + DaisyUI | working |
| `apps/react-demo/` | Vite + React 19 + Tailwind + DaisyUI | working |
| `apps/vue-demo/` | Vue 3 + Vite | planned |

```bash
nx serve angular-demo       # dev server
nx build angular-demo       # production build
npm run build:lens          # build the package itself
```

## Docs

- [Introduction](https://github.com/hypertheory-labs/msw-lens/blob/main/docs/introduction.md) — the thesis, slower
- [Getting started](https://github.com/hypertheory-labs/msw-lens/blob/main/docs/getting-started.md) — tutorial walkthrough
- [The scenario switcher](https://github.com/hypertheory-labs/msw-lens/blob/main/docs/scenario-switcher.md) — daily workflow
- [The context generator](https://github.com/hypertheory-labs/msw-lens/blob/main/docs/context-generator.md) — the feature that matters
- [Manifest format](https://github.com/hypertheory-labs/msw-lens/blob/main/docs/manifest-format.md) — field-by-field reference
- [Scenario archetypes](https://github.com/hypertheory-labs/msw-lens/blob/main/docs/scenario-archetypes.md) — vocabulary cheatsheet

## Related

- [Stellar Devtools](https://stellar.hypertheory-labs.dev) — observes app state, records causal chains (click → HTTP → state change), exports as AI-readable markdown. Stellar = observe. msw-lens = control.
