# msw-lens — project context
generated: 2026-04-03T14:59:17.269Z

> Drop this file into any LLM conversation for instant context about what
> is mocked in this project, what scenarios exist, and what is currently active.

## Active scenarios

| endpoint | method | active scenario |
|----------|--------|-----------------|
| `https://store.company.com/user/cart` | GET | `zero-price-item` |
| `https://store.company.com/user/cart/:id` | PATCH | `validation-error` |
| `https://store.company.com/user/cart/:id` | DELETE | `slow` |
| `/api/user/` | GET | `logged-in` |

## Scenario details

### GET `https://store.company.com/user/cart`
manifest: `src/app/__mocks__/cart/cart.yaml`
> Current user's shopping cart items

- **typical** — Cart with several items — the happy path; verifies each item renders with name, unit price, quantity, and computed total
- **empty** — Cart contains no items — tests whether an empty-state message and call-to-action appear (currently the template has no @empty block; this will render as a blank page body)
- **single-item** — Exactly one item in the cart — edge of the list; tests singular layout and verifies @for renders without a minimum-item assumption
- **large-cart** — Twelve or more items — tests whether the list overflows its container or requires pagination that doesn't exist yet
- **slow** *(delay: real)* — Simulates a sluggish cart service — tests whether a loading skeleton or spinner appears during fetch (currently no loading state in the template)
- **unauthorized** *(401)* — User session has expired — tests whether an auth guard intercepts and redirects to login, or whether the component silently shows an empty cart
- **server-error** *(500)* — Cart service is unavailable — tests whether an error message or fallback UI appears (currently _load() swallows fetch errors silently)
- **zero-price-item** ✓ **(active)** — Cart includes a fully discounted item at $0.00 — tests that the currency pipe renders zero gracefully and the line total shows $0.00 rather than blank or NaN
- **high-value** — Items with high unit prices and large quantities — tests that four-to-five digit currency totals don't truncate or overflow the flex layout

sourceHints:
- `src/app/areas/shopping-cart/shopping-cart-landing/data/cart-store.ts`
- `src/app/areas/shopping-cart/shopping-cart-landing/internal/pages/cart.ts`

### PATCH `https://store.company.com/user/cart/:id`
manifest: `src/app/__mocks__/cart/cart-patch.yaml`
> Update the quantity of a cart item

- **success** — Quantity updated — UI reflects new value and recomputed line total (optimistic update already applied)
- **validation-error** ✓ **(active)** *(400)* — Invalid quantity in request body — tests whether the UI surfaces a field-level error or silently ignores the failure
- **server-error** *(500)* — Cart service unavailable — tests whether the optimistic update is rolled back or left as stale UI
- **slow** *(delay: real)* — Sluggish cart service — tests whether the +/- buttons show a pending state or allow rapid re-clicks

sourceHints:
- `src/app/areas/shopping-cart/shopping-cart-landing/data/cart-store.ts`
- `src/app/areas/shopping-cart/shopping-cart-landing/internal/pages/cart.ts`

### DELETE `https://store.company.com/user/cart/:id`
manifest: `src/app/__mocks__/cart/cart-delete.yaml`
> Remove an item from the current user's cart

- **success** — Item removed — UI removes the row; if cart is now empty, the @empty block should render
- **server-error** *(500)* — Cart service unavailable — tests whether the optimistic removal is rolled back or the item stays gone from the UI
- **slow** ✓ **(active)** *(delay: real)* — Sluggish cart service — tests whether the Remove button shows a pending state or allows a second click

sourceHints:
- `src/app/areas/shopping-cart/shopping-cart-landing/data/cart-store.ts`
- `src/app/areas/shopping-cart/shopping-cart-landing/internal/pages/cart.ts`

### GET `/api/user/`
manifest: `src/app/__mocks__/auth/user.yaml`
> Currently authenticated user profile

- **logged-in** ✓ **(active)** — Authenticated user with Student and Employee roles — the happy path
- **logged-out** *(401)* — No active session — tests that auth guards redirect correctly and login UI appears
- **slow** *(delay: real)* — Simulates a sluggish auth service — tests loading skeleton states in consuming components
- **server-error** *(500)* — Auth service is unavailable — tests error boundary or fallback UI behavior
- **admin** — User with an elevated Admin role — tests role-based UI variations (nav items, gated features)

sourceHints:
- `src/app/areas/shared/util-auth/store.ts`
- `src/app/areas/shared/util-auth/internal/types.ts`

---

## How msw-lens works

msw-lens reads scenario manifests — YAML files co-located with MSW handlers in `__mocks__`
directories — and writes the active selection to `src/app/__mocks__/active-scenarios.ts`.
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
