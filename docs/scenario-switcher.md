---
title: The scenario switcher
description: Using `npm run lens` to flip between mock scenarios without editing handler files.
---

The switcher is the daily-driver feature. You have your app running in the browser, something looks off, you want to see it under a different condition — network error, empty state, slow response — without touching handler files.

```bash
npm run lens            # single run
npm run lens:watch      # stay in the switcher, Ctrl+C to exit
```

## What you see

The TUI lists every endpoint it discovered (one entry per manifest file). For each, it shows:

- the endpoint URL and HTTP method
- the active scenario, highlighted
- the other scenarios available, with their descriptions

You navigate with arrow keys, pick an endpoint, pick a scenario, confirm. msw-lens writes your selection to `src/mocks/active-scenarios.ts`. Your handlers import from that file and switch behavior immediately.

The tool never modifies handler files. It only writes `active-scenarios.ts`.

## Live updates

If your app is running under Vite (or any dev server that does HMR on TypeScript modules), the change propagates instantly. The browser doesn't reload; the next HTTP request just takes the new code path. No MSW restart, no browser refresh, no lost form state.

The reason this works: `active-scenarios.ts` is a regular TypeScript module. When it changes, Vite invalidates any module that imports it (your handlers), and those handlers re-run with the new scenario values. Browsers don't have to know anything changed — the service worker is still running, but its behavior is governed by a module that just got swapped.

## When to use watch mode

`npm run lens` exits after one change. That's fine when you're making a single flip.

`npm run lens:watch` stays in the switcher. Useful when you're:

- debugging a sequence of states (empty → typical → loading → error)
- giving a live demo
- exercising a form through its validation-error → conflict → success scenarios in a row

## What gets committed

```
src/mocks/active-scenarios.ts
```

Yes, commit it. Here's why: this file captures "what state my app is running under right now." If you push a feature branch that depends on the `unauthorized` scenario being active, a teammate pulling the branch needs that setting. If an AI instance reads your repo to help debug, knowing which scenario is live tells it why the UI behavior matches (or doesn't match) what you're describing.

The file looks like this:

```typescript
const activeScenarios: Record<string, string> = {
  'GET /api/cart': 'typical',
  'POST /api/products': 'success',
};

export default activeScenarios;
```

Readable. Editable by hand in a pinch. But msw-lens owns it — don't hand-edit unless the tool isn't available.
