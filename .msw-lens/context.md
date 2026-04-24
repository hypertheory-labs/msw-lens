# msw-lens — project context
generated: 2026-04-24T17:05:36.132Z

> Drop this file into any LLM conversation for instant context about what
> is mocked in this project, what scenarios exist, and what is currently active.

## Active scenarios

| endpoint | method | active scenario |
|----------|--------|-----------------|
| `https://store.company.com/products` | POST | `created` |
| `https://store.company.com/products` | GET | `typical` |
| `https://store.company.com/user/cart` | GET | `zero-price-item` |
| `https://store.company.com/user/cart/:id` | PATCH | `validation-error` |
| `https://store.company.com/user/cart/:id` | DELETE | `slow` |
| `/api/user/` | GET | `logged-in` |

## Scenario details

### POST `https://store.company.com/products`
manifest: `apps/angular-demo/src/app/__mocks__/products/products-post.yaml`
> Create a new product — expects name, description, price, cost; returns the created item with a server-assigned id

- **created** ✓ **(active)** *(201)* — Product created successfully — form resets, product count increments by one
- **validation-error** *(422)* — Server rejects the submission — tests whether ProblemDetails errors surface in the UI (currently no server-error handling in the template; form will silently reset)
- **conflict** *(409)* — A product with this name already exists — tests whether the UI surfaces the 409 conflict message or silently clears the form
- **unauthorized** *(401)* — Session expired mid-form — tests whether an auth guard intercepts or the form fails silently
- **forbidden** *(403)* — User lacks permission to create products — tests whether a 403 is surfaced or silently swallowed (no role-gating visible in the template)
- **server-error** *(500)* — Product service unavailable — currently createProduct() will reset the form anyway, making it appear the product was created; tests whether this silent failure is acceptable
- **slow** *(delay: real)* — Sluggish product service — tests whether the Create Product button shows a pending/disabled state during submission (currently it does not)

sourceHints:
- `apps/angular-demo/src/app/areas/shopping-cart/shopping-cart-landing/data/product-store.ts`
- `apps/angular-demo/src/app/areas/shopping-cart/shopping-cart-landing/internal/pages/add-product.ts`

### GET `https://store.company.com/products`
manifest: `apps/angular-demo/src/app/__mocks__/products/products-get.yaml`
> Full product catalogue — name, description, price, cost per item

- **typical** ✓ **(active)** — Several products loaded — the happy path; verifies product count renders correctly and the form is ready for input
- **empty** — No products yet — tests whether the count shows zero and the form is still usable (currently the template shows 0 without any empty-state messaging)
- **slow** *(delay: real)* — Sluggish catalogue service — tests whether any loading state appears during fetch (currently none visible in the template)
- **unauthorized** *(401)* — Session expired before the page loaded — tests whether an auth guard intercepts and redirects to login
- **server-error** *(500)* — Catalogue service unavailable — tests whether an error boundary or fallback UI appears (currently _load() swallows fetch errors silently)

sourceHints:
- `apps/angular-demo/src/app/areas/shopping-cart/shopping-cart-landing/data/product-store.ts`
- `apps/angular-demo/src/app/areas/shopping-cart/shopping-cart-landing/internal/pages/add-product.ts`

### GET `https://store.company.com/user/cart`
manifest: `apps/angular-demo/src/app/__mocks__/cart/cart.yaml`
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
- `apps/angular-demo/src/app/areas/shopping-cart/shopping-cart-landing/data/cart-store.ts`
- `apps/angular-demo/src/app/areas/shopping-cart/shopping-cart-landing/internal/pages/cart.ts`

### PATCH `https://store.company.com/user/cart/:id`
manifest: `apps/angular-demo/src/app/__mocks__/cart/cart-patch.yaml`
> Update the quantity of a cart item

- **success** — Quantity updated — UI reflects new value and recomputed line total (optimistic update already applied)
- **validation-error** ✓ **(active)** *(400)* — Invalid quantity in request body — tests whether the UI surfaces a field-level error or silently ignores the failure
- **server-error** *(500)* — Cart service unavailable — tests whether the optimistic update is rolled back or left as stale UI
- **slow** *(delay: real)* — Sluggish cart service — tests whether the +/- buttons show a pending state or allow rapid re-clicks

sourceHints:
- `apps/angular-demo/src/app/areas/shopping-cart/shopping-cart-landing/data/cart-store.ts`
- `apps/angular-demo/src/app/areas/shopping-cart/shopping-cart-landing/internal/pages/cart.ts`

### DELETE `https://store.company.com/user/cart/:id`
manifest: `apps/angular-demo/src/app/__mocks__/cart/cart-delete.yaml`
> Remove an item from the current user's cart

- **success** — Item removed — UI removes the row; if cart is now empty, the @empty block should render
- **server-error** *(500)* — Cart service unavailable — tests whether the optimistic removal is rolled back or the item stays gone from the UI
- **slow** ✓ **(active)** *(delay: real)* — Sluggish cart service — tests whether the Remove button shows a pending state or allows a second click

sourceHints:
- `apps/angular-demo/src/app/areas/shopping-cart/shopping-cart-landing/data/cart-store.ts`
- `apps/angular-demo/src/app/areas/shopping-cart/shopping-cart-landing/internal/pages/cart.ts`

### GET `/api/user/`
manifest: `apps/angular-demo/src/app/__mocks__/auth/user.yaml`
> Currently authenticated user profile

- **logged-in** ✓ **(active)** — Authenticated user with Student and Employee roles — the happy path
- **logged-out** *(401)* — No active session — tests that auth guards redirect correctly and login UI appears
- **slow** *(delay: real)* — Simulates a sluggish auth service — tests loading skeleton states in consuming components
- **server-error** *(500)* — Auth service is unavailable — tests error boundary or fallback UI behavior
- **admin** — User with an elevated Admin role — tests role-based UI variations (nav items, gated features)

sourceHints:
- `apps/angular-demo/src/app/areas/shared/util-auth/store.ts`
- `apps/angular-demo/src/app/areas/shared/util-auth/internal/types.ts`

---

## How msw-lens works

msw-lens reads scenario manifests — YAML files co-located with MSW handlers in `__mocks__`
directories — and writes the active selection to `apps/angular-demo/src/app/__mocks__/active-scenarios.ts`.
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
