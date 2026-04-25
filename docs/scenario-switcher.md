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
- the active scenario (or `bypass`, if the endpoint is currently bypassing MSW), highlighted
- the other scenarios available, with their descriptions
- `bypass — pass through to real API` as an option for every endpoint

You navigate with arrow keys, pick an endpoint, pick a scenario (or bypass), confirm. msw-lens writes your selection to `src/mocks/active-scenarios.ts` (or `src/mocks/bypassed-endpoints.ts` for bypass). Your handlers and the registration filter import from those files and switch behavior immediately.

The tool never modifies handler files. It only writes the two state files.

## Bypass — pass through to the real API

Bypass is a per-endpoint option in the scenario picker. When you pick it, msw-lens removes that endpoint's handler from MSW registration entirely; the next matching request flows through to the real network instead of being intercepted.

Picking a real scenario for a previously-bypassed endpoint un-bypasses it. The two states are mutually exclusive — an endpoint is either mocked under a chosen scenario, or bypassed.

**Requires MSW configured with `onUnhandledRequest: 'bypass'`** in your `worker.start()` call. Without it, MSW will warn (or in stricter configs, error) on every unhandled request instead of letting it pass through. See [Getting started](./getting-started) for the exact setup.

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
src/mocks/bypassed-endpoints.ts
```

Yes, commit both. They capture "what state my app is running under right now." If you push a feature branch that depends on the `unauthorized` scenario being active or `/api/auth` being bypassed against a staging service, a teammate pulling the branch needs those settings. If an AI instance reads your repo to help debug, knowing which scenarios are live tells it why the UI behavior matches (or doesn't match) what you're describing.

`active-scenarios.ts` looks like this:

```typescript
const activeScenarios: Record<string, string> = {
  'GET /api/cart': 'typical',
  'POST /api/products': 'success',
};

export default activeScenarios;
```

`bypassed-endpoints.ts` looks like this:

```typescript
const bypassed = new Set<string>([
  'GET /api/health',
]);

export default bypassed;
```

Readable. Editable by hand in a pinch. But msw-lens owns both — don't hand-edit unless the tool isn't available.
