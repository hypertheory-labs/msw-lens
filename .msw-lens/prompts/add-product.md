# msw-lens context
generated: 2026-04-03T14:59:17.270Z
entry: src/app/areas/shopping-cart/shopping-cart-landing/internal/pages/add-product.ts

---

## The ask

I'm working on the `AddProduct` component in an Angular application and want to
create MSW mock scenarios for the endpoints it depends on.

Based on the source files below, please:

1. Identify the HTTP endpoints this component reaches (through its store or service)
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
anything in the component or template that suggests a scenario I should consider
but haven't asked about — flag it.

---

## Source files

### add-product.ts
`src/app/areas/shopping-cart/shopping-cart-landing/internal/pages/add-product.ts`
```typescript
import { Component, inject, signal } from '@angular/core';
import { PageLayout } from '@ht/shared/ui-common/layouts/page';
import { ProductCreateModel, productStore } from '../../data/product-store';
import { form, required, validate, FormRoot, FormField } from '@angular/forms/signals';

@Component({
  selector: 'app-shopping-cart-pages-add-product',
  imports: [PageLayout, FormRoot, FormField],
  template: `<app-ui-page title="Add A Product">
    <p>We Have {{ store.entities().length }} products in our store.</p>
    <form [formRoot]="form">
      <div class="form-control p-4 ">
        <label class="label validator" for="name"
          ><span class="label-text font-medium">Name</span></label
        >
        <input
          class="input input-sm "
          [class.input-error]="
            form.name().invalid() && (form.name().dirty() || form.name().touched())
          "
          [formField]="form.name"
          id="name"
          type="text"
        />
        @if (form.name().invalid() && (form.name().dirty() || form.name().touched())) {
          @for (e of form.name().errors(); track e) {
            <p class="text-sm text-error ml-24 pt-4">{{ e.message }}</p>
          }
        }
      </div>
      <div class="form-control p-4 ">
        <label class="label validator" for="description"
          ><span class="label-text font-medium">Description</span></label
        >
        <input
          class="input input-sm "
          [class.input-error]="
            form.description().invalid() &&
            (form.description().dirty() || form.description().touched())
          "
          [formField]="form.description"
          id="description"
          type="text"
        />
        @if (
          form.description().invalid() &&
          (form.description().dirty() || form.description().touched())
        ) {
          @for (e of form.description().errors(); track e) {
            <p class="text-sm text-error ml-24 pt-4">{{ e.message }}</p>
          }
        }
      </div>
      <div class="form-control p-4 ">
        <label class="label validator" for="price"
          ><span class="label-text font-medium">Price</span></label
        >
        <input
          class="input input-sm "
          [class.input-error]="
            form.price().invalid() && (form.price().dirty() || form.price().touched())
          "
          [formField]="form.price"
          id="price"
          type="number"
        />
        @if (form.price().invalid() && (form.price().dirty() || form.price().touched())) {
          @for (e of form.price().errors(); track e) {
            <p class="text-sm text-error ml-24 pt-4">{{ e.message }}</p>
          }
        }
      </div>
      <div class="form-control p-4 ">
        <label class="label validator" for="cost"
          ><span class="label-text font-medium">Cost</span></label
        >
        <input
          class="input input-sm "
          [class.input-error]="
            form.cost().invalid() && (form.cost().dirty() || form.cost().touched())
          "
          [formField]="form.cost"
          id="cost"
          type="number"
        />
        @if (form.cost().invalid() && (form.cost().dirty() || form.cost().touched())) {
          @for (e of form.cost().errors(); track e) {
            <p class="text-sm text-error ml-24 pt-4">{{ e.message }}</p>
          }
        }
      </div>
      <button class="btn btn-primary m-4" type="submit">Create Product</button>
    </form>
  </app-ui-page>`,
  styles: `
    .form-control {
      label {
        padding-right: 2rem;
      }
    }
  `,
})
export class AddProductPage {
  protected readonly store = inject(productStore);
  model = signal<ProductCreateModel>({
    name: '',
    description: '',
    price: 0,
    cost: 0,
  });
  form = form(
    this.model,
    (m) => {
      required(m.name);
      required(m.description);
      validate(m.price, ({ value, valueOf }) => {
        const price = value();
        const cost = valueOf(m.cost);

        if (price < cost)
          return {
            kind: 'priceTooLow',
            message: 'Price must be greater than cost',
          };
        return null;
      });
    },
    {
      submission: {
        action: async (form) => {
          await this.store.createProduct(form().value());
          form().reset();
        },
        onInvalid: (form) => {
          form().errorSummary()[0]?.fieldTree().focusBoundControl();
        },
      },
    },
  );
}
```

### product-store.ts
`src/app/areas/shopping-cart/shopping-cart-landing/data/product-store.ts`
```typescript
import { signalStore, withMethods, patchState } from '@ngrx/signals';
import { withEntities, addEntity, setEntities } from '@ngrx/signals/entities';

export type ProductApiItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  cost: number;
};

export type ProductCreateModel = Omit<ProductApiItem, 'id'>;

const BASE = 'https://store.company.com/products';

export const productStore = signalStore(
  withEntities<ProductApiItem>(),
  withMethods((state) => {
    async function createProduct(product: ProductCreateModel) {
      const newProduct = (await fetch(BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product),
      }).then((res) => res.json())) as ProductApiItem;
      patchState(state, addEntity(newProduct));
    }

    return {
      _load: async () => {
        const products = (await fetch(BASE).then((res) => res.json())) as ProductApiItem[];
        patchState(state, setEntities(products));
      },

      createProduct,
    };
  }),
);
```

---

## Handler registration

### handlers.ts
`src/app/__mocks__/handlers.ts`
```typescript
import { HttpHandler } from 'msw';
import authHandler from './auth/user';
import cartHandler from './cart/cart';
import cartPatchHandler from './cart/cart-patch';
import cartDeleteHandler from './cart/cart-delete';

export const handlers: HttpHandler[] = [
  ...authHandler,
  ...cartHandler,
  ...cartPatchHandler,
  ...cartDeleteHandler,
];
```

---

## Existing manifests + handlers (pattern reference)

### cart.yaml
`src/app/__mocks__/cart/cart.yaml`
```yaml
# MSW Scenario Manifest
# This file is the source of truth for what scenarios exist for this endpoint.
# It is read by msw-lens to populate the scenario switcher.
# It can also be dropped into an LLM conversation as context.

endpoint: https://store.company.com/user/cart
method: GET
shape: collection
description: Current user's shopping cart items

responseType:
  name: CartApiItem[]
  path: src/app/areas/shopping-cart/shopping-cart-landing/data/cart-store.ts

context:
  sourceHints:
    - src/app/areas/shopping-cart/shopping-cart-landing/data/cart-store.ts
    - src/app/areas/shopping-cart/shopping-cart-landing/internal/pages/cart.ts

scenarios:
  typical:
    description: Cart with several items — the happy path; verifies each item renders with name, unit price, quantity, and computed total
    active: true

  empty:
    description: Cart contains no items — tests whether an empty-state message and call-to-action appear (currently the template has no @empty block; this will render as a blank page body)

  single-item:
    description: Exactly one item in the cart — edge of the list; tests singular layout and verifies @for renders without a minimum-item assumption

  large-cart:
    description: Twelve or more items — tests whether the list overflows its container or requires pagination that doesn't exist yet

  slow:
    description: Simulates a sluggish cart service — tests whether a loading skeleton or spinner appears during fetch (currently no loading state in the template)
    delay: real

  unauthorized:
    description: User session has expired — tests whether an auth guard intercepts and redirects to login, or whether the component silently shows an empty cart
    httpStatus: 401

  server-error:
    description: Cart service is unavailable — tests whether an error message or fallback UI appears (currently _load() swallows fetch errors silently)
    httpStatus: 500

  zero-price-item:
    description: Cart includes a fully discounted item at $0.00 — tests that the currency pipe renders zero gracefully and the line total shows $0.00 rather than blank or NaN

  high-value:
    description: Items with high unit prices and large quantities — tests that four-to-five digit currency totals don't truncate or overflow the flex layout
```

### cart.ts
`src/app/__mocks__/cart/cart.ts`
```typescript
import { http, HttpHandler, delay, HttpResponse } from 'msw';
import activeScenarios from '../active-scenarios';
import { CartApiItem } from '../../areas/shopping-cart/shopping-cart-landing/data/cart-store';

const ENDPOINT = 'https://store.company.com/user/cart';

const typicalItems: CartApiItem[] = [
  { id: '1', name: 'Mechanical Keyboard', price: 129.99, quantity: 1 },
  { id: '2', name: 'USB-C Hub', price: 49.99, quantity: 2 },
  { id: '3', name: 'Monitor Stand', price: 34.95, quantity: 1 },
];

const largeCartItems: CartApiItem[] = Array.from({ length: 12 }, (_, i) => ({
  id: String(i + 1),
  name: `Cart Item ${i + 1}`,
  price: parseFloat((9.99 + i * 3.5).toFixed(2)),
  quantity: i + 1,
}));

export default [
  http.get(ENDPOINT, async () => {
    const scenario = activeScenarios[`GET ${ENDPOINT}`] ?? 'typical';

    switch (scenario) {
      case 'empty':
        return HttpResponse.json([]);

      case 'single-item':
        return HttpResponse.json([typicalItems[0]]);

      case 'large-cart':
        return HttpResponse.json(largeCartItems);

      case 'slow':
        await delay('real');
        return HttpResponse.json(typicalItems);

      case 'unauthorized':
        return new HttpResponse(null, { status: 401 });

      case 'server-error':
        return new HttpResponse(null, { status: 500 });

      case 'zero-price-item':
        return HttpResponse.json([
          ...typicalItems,
          { id: '99', name: 'Promo Item (Free)', price: 0, quantity: 1 },
        ]);

      case 'high-value':
        return HttpResponse.json([
          { id: '1', name: 'Pro Laptop', price: 2499.99, quantity: 2 },
          { id: '2', name: 'External GPU', price: 899.0, quantity: 3 },
          { id: '3', name: 'Studio Monitor', price: 1299.99, quantity: 4 },
        ]);

      case 'typical':
      default:
        await delay();
        return HttpResponse.json(typicalItems);
    }
  }),
] as HttpHandler[];
```

### cart-patch.yaml
`src/app/__mocks__/cart/cart-patch.yaml`
```yaml
# MSW Scenario Manifest
# This file is the source of truth for what scenarios exist for this endpoint.
# It is read by msw-lens to populate the scenario switcher.
# It can also be dropped into an LLM conversation as context.

endpoint: https://store.company.com/user/cart/:id
method: PATCH
description: Update the quantity of a cart item

errorType:
  name: ProblemDetails
  path: src/app/areas/shared/util-types/problem-details.ts

context:
  sourceHints:
    - src/app/areas/shopping-cart/shopping-cart-landing/data/cart-store.ts
    - src/app/areas/shopping-cart/shopping-cart-landing/internal/pages/cart.ts

scenarios:
  success:
    description: Quantity updated — UI reflects new value and recomputed line total (optimistic update already applied)
    active: true

  validation-error:
    description: Invalid quantity in request body — tests whether the UI surfaces a field-level error or silently ignores the failure
    httpStatus: 400

  server-error:
    description: Cart service unavailable — tests whether the optimistic update is rolled back or left as stale UI
    httpStatus: 500

  slow:
    description: Sluggish cart service — tests whether the +/- buttons show a pending state or allow rapid re-clicks
    delay: real
```

### cart-patch.ts
`src/app/__mocks__/cart/cart-patch.ts`
```typescript
import { http, HttpHandler, delay, HttpResponse } from 'msw';
import activeScenarios from '../active-scenarios';

const ENDPOINT = 'https://store.company.com/user/cart/:id';
const SCENARIO_KEY = 'PATCH https://store.company.com/user/cart/:id';

export default [
  http.patch(ENDPOINT, async () => {
    const scenario = activeScenarios[SCENARIO_KEY] ?? 'success';

    switch (scenario) {
      case 'validation-error':
        return HttpResponse.json(
          {
            type: 'https://store.company.com/errors/invalid-quantity',
            title: 'Invalid quantity',
            status: 400,
            detail: 'Quantity must be a positive integer.',
            errors: { quantity: ['Must be greater than zero.'] },
          },
          { status: 400 },
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
] as HttpHandler[];
```

### cart-delete.yaml
`src/app/__mocks__/cart/cart-delete.yaml`
```yaml
# MSW Scenario Manifest
# This file is the source of truth for what scenarios exist for this endpoint.
# It is read by msw-lens to populate the scenario switcher.
# It can also be dropped into an LLM conversation as context.

endpoint: https://store.company.com/user/cart/:id
method: DELETE
description: Remove an item from the current user's cart

errorType:
  name: ProblemDetails
  path: src/app/areas/shared/util-types/problem-details.ts

context:
  sourceHints:
    - src/app/areas/shopping-cart/shopping-cart-landing/data/cart-store.ts
    - src/app/areas/shopping-cart/shopping-cart-landing/internal/pages/cart.ts

scenarios:
  success:
    description: Item removed — UI removes the row; if cart is now empty, the @empty block should render
    active: true

  server-error:
    description: Cart service unavailable — tests whether the optimistic removal is rolled back or the item stays gone from the UI
    httpStatus: 500

  slow:
    description: Sluggish cart service — tests whether the Remove button shows a pending state or allows a second click
    delay: real
```

### cart-delete.ts
`src/app/__mocks__/cart/cart-delete.ts`
```typescript
import { http, HttpHandler, delay, HttpResponse } from 'msw';
import activeScenarios from '../active-scenarios';

const ENDPOINT = 'https://store.company.com/user/cart/:id';
const SCENARIO_KEY = 'DELETE https://store.company.com/user/cart/:id';

export default [
  http.delete(ENDPOINT, async () => {
    const scenario = activeScenarios[SCENARIO_KEY] ?? 'success';

    switch (scenario) {
      case 'server-error':
        return new HttpResponse(null, { status: 500 });

      case 'slow':
        await delay('real');
        return new HttpResponse(null, { status: 204 });

      case 'success':
      default:
        return new HttpResponse(null, { status: 204 });
    }
  }),
] as HttpHandler[];
```

### user.yaml
`src/app/__mocks__/auth/user.yaml`
```yaml
# MSW Scenario Manifest
# This file is the source of truth for what scenarios exist for this endpoint.
# It is read by msw-lens to populate the scenario switcher.
# It can also be dropped into an LLM conversation as context.

endpoint: /api/user/
method: GET
shape: document  # document | collection
description: Currently authenticated user profile

responseType:
  name: AuthUser
  path: src/app/areas/shared/util-auth/internal/types.ts

# sourceHints: paths to files that consume or depend on this endpoint.
# An LLM will read these to understand what scenarios are worth testing.
# You provide the pointers — the LLM derives the meaning.
context:
  sourceHints:
    - src/app/areas/shared/util-auth/store.ts
    - src/app/areas/shared/util-auth/internal/types.ts

scenarios:
  logged-in:
    description: Authenticated user with Student and Employee roles — the happy path
    active: true

  logged-out:
    description: No active session — tests that auth guards redirect correctly and login UI appears
    httpStatus: 401

  slow:
    description: Simulates a sluggish auth service — tests loading skeleton states in consuming components
    delay: real

  server-error:
    description: Auth service is unavailable — tests error boundary or fallback UI behavior
    httpStatus: 500

  admin:
    description: User with an elevated Admin role — tests role-based UI variations (nav items, gated features)
```

### user.ts
`src/app/__mocks__/auth/user.ts`
```typescript
import { http, HttpHandler, delay, HttpResponse } from 'msw';
import activeScenarios from '../active-scenarios';
import { AuthUser } from '../../areas/shared/util-auth/internal/types';

const loggedInUser: AuthUser = {
  sub: '8c5cda73-b2d9-4dc8-9356-64e1304ddb3b',
  name: 'Tracy Student',
  given_name: 'Tracy',
  family_name: 'Student',
  preferred_username: 'Tracy',
  email: 'tracey@compuserve.com',
  role: ['Student', 'Employee'],
};

export default [
  http.get('/api/user/', async () => {
    const scenario = activeScenarios['GET /api/user/'] ?? 'logged-in';

    switch (scenario) {
      case 'logged-out':
        return new HttpResponse(null, { status: 401 });

      case 'slow':
        await delay('real');
        return HttpResponse.json(loggedInUser);

      case 'server-error':
        return new HttpResponse(null, { status: 500 });

      case 'admin':
        return HttpResponse.json({ ...loggedInUser, role: ['Student', 'Employee', 'Admin'] });

      case 'logged-in':
      default:
        await delay();
        return HttpResponse.json(loggedInUser);
    }
  }),
] as HttpHandler[];
```

---

## About msw-lens

msw-lens manages MSW scenario switching for Angular development. Manifests live
alongside handlers in `__mocks__` directories. The active scenario is written to
`src/app/__mocks__/active-scenarios.ts` — Vite HMR picks it up immediately.

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
