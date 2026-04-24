# msw-lens context
generated: 2026-04-24T17:04:29.556Z
entry: src/features/cart/Cart.tsx

---

## The ask

I'm working on the `Cart` component in a web application and want to
create MSW mock scenarios for the endpoints it depends on.

Based on the source files below, please:

1. Identify the HTTP endpoints this component reaches — through its hooks, stores, services, or direct fetch/http calls
2. For each endpoint, generate a `.yaml` manifest in msw-lens format
3. For each endpoint, also generate a handler stub (`.ts`) with a switch statement
   over the scenario names — match the pattern in the existing handler files
4. Register the new handler in `handlers.ts` — match the existing import pattern
5. For each scenario, cover: happy path, empty/null states, error conditions
   (with appropriate HTTP status codes), slow/timeout, and any edge cases the
   **response type shape** suggests I haven't anticipated

**On scenario descriptions:** say what UI behavior it tests, not what the data
looks like. Not: "Returns an empty items array." Instead: "Tests that the empty
cart message appears and the checkout button disables."

Use the format and vocabulary from the existing manifests below. If you notice
anything in the component or its markup that suggests a scenario I should
consider but haven't asked about — flag it.

If the provided files are incomplete — init methods with no visible call site,
protected routes with no guard in scope, dependencies that seem to come from
outside what was crawled — **list your assumptions explicitly** rather than
silently filling the gaps.

---

## Source files

### Cart.tsx
`src/features/cart/Cart.tsx`
```typescript
import { useCart } from './useCart';

export function Cart() {
  const state = useCart();

  if (state.status === 'idle' || state.status === 'loading') {
    return <div aria-busy="true">Loading cart…</div>;
  }

  if (state.status === 'error') {
    return (
      <div role="alert">
        Could not load your cart. {state.message}
      </div>
    );
  }

  const { cart } = state;

  if (cart.items.length === 0) {
    return (
      <div>
        <h2>Your cart is empty</h2>
        <button disabled>Checkout</button>
      </div>
    );
  }

  return (
    <div>
      <h2>Cart</h2>
      <ul>
        {cart.items.map((item) => (
          <li key={item.id}>
            {item.name} × {item.quantity} — ${(item.price * item.quantity).toFixed(2)}
          </li>
        ))}
      </ul>
      <p>Total: ${cart.total.toFixed(2)}</p>
      <button>Checkout</button>
    </div>
  );
}
```

### useCart.ts
`src/features/cart/useCart.ts`
```typescript
import { useEffect, useState } from 'react';
import type { Cart } from '../../types';

export type CartState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; cart: Cart }
  | { status: 'error'; message: string };

export function useCart(): CartState {
  const [state, setState] = useState<CartState>({ status: 'idle' });

  useEffect(() => {
    let cancelled = false;
    setState({ status: 'loading' });

    fetch('/api/cart')
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<Cart>;
      })
      .then((cart) => {
        if (!cancelled) setState({ status: 'ready', cart });
      })
      .catch((err) => {
        if (!cancelled) setState({ status: 'error', message: String(err) });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
```

### types.ts
`src/types.ts`
```typescript
export type CartItem = {
  id: string;
  productId: string;
  name: string;
  quantity: number;
  price: number;
};

export type Cart = {
  items: CartItem[];
  total: number;
};
```

---

## Handler registration

### handlers.ts
`src/mocks/handlers.ts`
```typescript
import { HttpHandler } from 'msw';
import cartHandler from './cart/cart';

export const handlers: HttpHandler[] = [
  ...cartHandler,
];
```

---

## Existing manifests + handlers (pattern reference)

### cart.yaml
`src/mocks/cart/cart.yaml`
```yaml
# yaml-language-server: $schema=https://unpkg.com/@hypertheory-labs/msw-lens/schema/manifest.schema.json

endpoint: /api/cart
method: GET
shape: collection
description: User's shopping cart — items plus computed total

responseType:
  name: Cart
  path: apps/react-demo/src/types.ts

context:
  sourceHints:
    - apps/react-demo/src/features/cart/useCart.ts

scenarios:
  typical:
    description: Cart has multiple items — renders the item list, line totals, and enables checkout
    active: true

  empty:
    description: Zero items — tests that the empty-cart message appears and the Checkout button disables

  slow:
    description: Sluggish backend — tests that the loading state renders before the cart appears
    delay: real

  unauthorized:
    description: Session expired — tests that the UI surfaces an authentication error rather than silently rendering an empty cart
    httpStatus: 401

  server-error:
    description: Backend unreachable — tests that the error alert appears with a recoverable message
    httpStatus: 500
```

### cart.ts
`src/mocks/cart/cart.ts`
```typescript
import { http, HttpHandler, HttpResponse, delay } from 'msw';
import activeScenarios from '../active-scenarios';
import type { Cart } from '../../types';

const ENDPOINT = '/api/cart';

const typicalCart: Cart = {
  items: [
    { id: '1', productId: 'p-widget', name: 'Widget', quantity: 2, price: 9.99 },
    { id: '2', productId: 'p-gadget', name: 'Gadget', quantity: 1, price: 24.5 },
  ],
  total: 44.48,
};

const emptyCart: Cart = { items: [], total: 0 };

export default [
  http.get(ENDPOINT, async () => {
    const scenario = activeScenarios[`GET ${ENDPOINT}`] ?? 'typical';

    switch (scenario) {
      case 'empty':
        return HttpResponse.json(emptyCart);
      case 'unauthorized':
        return new HttpResponse(null, { status: 401 });
      case 'server-error':
        return new HttpResponse(null, { status: 500 });
      case 'slow':
        await delay('real');
        return HttpResponse.json(typicalCart);
      case 'typical':
      default:
        return HttpResponse.json(typicalCart);
    }
  }),
] as HttpHandler[];
```

---

## About msw-lens

msw-lens manages MSW scenario switching for web development. Manifests live
alongside handlers in `__mocks__` directories. The active scenario is written to
`src/mocks/active-scenarios.ts` — Vite HMR picks it up immediately.

`active-scenarios.ts` is tool-owned. Do not include instructions to edit it manually.

Scenario archetypes to consider:

**Document endpoints** (single item responses):
- `happy-path` — successful response with typical data
- `not-found` — 404, resource doesn't exist
- `unauthorized` — 401, tests auth guards and login redirect
- `server-error` — 500, tests error boundary or fallback UI
- `slow` — MSW delay('real'), tests loading/skeleton states
- `malformed-data` — response missing optional fields or with unexpected nulls

**Collection endpoints** (array/list responses):
- `typical` — N items, normal case
- `empty` — zero items, tests empty-state UI
- `overloaded` — far more items than the UI was designed for (tests pagination, overflow)
- `slow` — tests loading skeleton
- `unauthorized` — 401
- `server-error` — 500

**Mutation endpoints** (POST / PUT / PATCH / DELETE):
- `success` / `created` — 201/202/204, happy path; tests UI confirmation, redirect, or form reset
- `validation-error` — 400/422, field-level ProblemDetails; tests whether error messages surface per-field or as a summary
- `conflict` — 409, duplicate or constraint violation; tests whether the UI surfaces a meaningful message
- `unauthorized` — 401, session expired mid-form; tests redirect or inline session error
- `forbidden` — 403, insufficient role; tests whether the UI blocks submission or shows an access error
- `server-error` — 500; tests whether the form retains input and shows a recoverable error message
- `slow` — MSW delay('real'); tests whether the submit button shows a pending/disabled state during submission
