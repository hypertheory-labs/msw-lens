# msw-lens — project context
generated: 2026-04-24T17:04:29.556Z

> Drop this file into any LLM conversation for instant context about what
> is mocked in this project, what scenarios exist, and what is currently active.

## Active scenarios

| endpoint | method | active scenario |
|----------|--------|-----------------|
| `/api/cart` | GET | `typical` |

## Scenario details

### GET `/api/cart`
manifest: `src/mocks/cart/cart.yaml`
> User's shopping cart — items plus computed total

- **typical** ✓ **(active)** — Cart has multiple items — renders the item list, line totals, and enables checkout
- **empty** — Zero items — tests that the empty-cart message appears and the Checkout button disables
- **slow** *(delay: real)* — Sluggish backend — tests that the loading state renders before the cart appears
- **unauthorized** *(401)* — Session expired — tests that the UI surfaces an authentication error rather than silently rendering an empty cart
- **server-error** *(500)* — Backend unreachable — tests that the error alert appears with a recoverable message

sourceHints:
- `apps/react-demo/src/features/cart/useCart.ts`

---

## How msw-lens works

msw-lens reads scenario manifests — YAML files co-located with MSW handlers in `__mocks__`
directories — and writes the active selection to `src/mocks/active-scenarios.ts`.
Vite HMR picks up that file change immediately. No browser refresh needed.

`active-scenarios.ts` is **tool-owned**. Do not edit it manually; msw-lens regenerates it
on every run.

**Commands:**
- `npm run lens` — interactive scenario switcher (single run)
- `npm run lens:watch` — stay in the switcher, Ctrl+C to exit
- `npm run lens:context -- <component.ts>` — generate a prompt for an LLM

Manifests live alongside handlers: `auth/user.yaml` next to `auth/user.ts`.

---

## Manifest format

```yaml
endpoint: /api/resource/
method: GET
shape: document         # document | collection — determines scenario vocabulary
description: What this endpoint returns

responseType:
  name: TypeScriptTypeName
  path: relative/path/to/types.ts

context:
  sourceHints:          # paths to files that consume this endpoint
    - path/to/store.ts  # LLM reads these directly — provide pointers, not summaries
    - path/to/component.ts

scenarios:
  scenario-name:
    description: What UI behavior this tests (not just what the data looks like)
    active: true        # marks the default scenario
    httpStatus: 401     # optional — omit for 200
    delay: real    # optional — MSW delay mode
```
