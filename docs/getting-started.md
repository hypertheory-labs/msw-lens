---
title: Getting started
description: Install msw-lens into an existing MSW project and run your first scenario switch.
---

This page assumes you already have MSW working in your project — a `browser.ts` that calls `setupWorker`, a `handlers.ts` that aggregates your handlers, and MSW starting up in your app's entry file.

If you don't have MSW set up yet, start with the [MSW docs](https://mswjs.io/docs/getting-started).

## Install

```bash
npm install --save-dev @hypertheory-labs/msw-lens
```

Add the scripts to your `package.json`:

```json
{
  "scripts": {
    "lens": "msw-lens",
    "lens:watch": "msw-lens --watch",
    "lens:context": "msw-lens --context"
  }
}
```

That's it. If your MSW handlers live in `src/mocks/` (MSW's recommended layout) there's no configuration to write.

If your mocks live somewhere else — `src/app/__mocks__/`, `apps/web/src/mocks/`, etc. — add a `msw-lens` block to `package.json`:

```json
{
  "msw-lens": {
    "mocksDir": "src/app/__mocks__"
  }
}
```

## Write your first manifest

Create a YAML file alongside an existing handler. If you have `src/mocks/cart/cart.ts`, create `src/mocks/cart/cart.yaml`:

```yaml
# yaml-language-server: $schema=https://unpkg.com/@hypertheory-labs/msw-lens/schema/manifest.schema.json

endpoint: /api/cart
method: GET
shape: collection
description: User's shopping cart — items and a computed total

scenarios:
  typical:
    description: Cart has items — renders the list, enables checkout
    active: true

  empty:
    description: Zero items — tests that the empty-cart message appears and Checkout disables
```

The modeline comment gives you schema autocomplete and validation in any editor with a YAML language server (VS Code + the [Red Hat YAML extension](https://marketplace.visualstudio.com/items?itemName=redhat.vscode-yaml) is the usual setup).

## Wire the handler to respect scenarios

Your handler reads the active scenario and switches:

```typescript
import { http, HttpHandler, HttpResponse } from 'msw';
import activeScenarios from '../active-scenarios';

const ENDPOINT = '/api/cart';

export default [
  http.get(ENDPOINT, () => {
    const scenario = activeScenarios[`GET ${ENDPOINT}`] ?? 'typical';

    switch (scenario) {
      case 'empty':
        return HttpResponse.json({ items: [], total: 0 });
      case 'typical':
      default:
        return HttpResponse.json({
          items: [{ id: '1', name: 'Widget', quantity: 2, price: 9.99 }],
          total: 19.98,
        });
    }
  }),
] as HttpHandler[];
```

The key is `"GET /api/cart"`, not `"/api/cart"`. If you have multiple methods on the same endpoint (PATCH and DELETE on `/cart/:id`), the method prefix keeps them distinct.

## Run the switcher

```bash
npm run lens
```

You'll see a terminal UI listing your endpoints. Select one, pick a scenario, exit. msw-lens writes `src/mocks/active-scenarios.ts` — a single file your handlers import. If your app is running, Vite HMR picks up the change and the UI updates without a reload.

Run `npm run lens:watch` to stay in the switcher between changes. Ctrl+C when done.

## What got committed

After your first run, your mocks directory looks like:

```
src/mocks/
  browser.ts
  handlers.ts
  active-scenarios.ts     ← created by msw-lens; tool-owned
  cart/
    cart.ts
    cart.yaml
```

And alongside your project root:

```
.msw-lens/
  context.md              ← regenerated on every lens run; always current
  prompts/                ← populated when you run lens:context
  README.md
```

**Commit `.msw-lens/`**. A new developer, a CI environment, or an AI instance starting fresh can read `context.md` and immediately know what's mocked, what scenarios exist, and what's active. That's the whole point.
