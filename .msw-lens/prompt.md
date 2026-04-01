# msw-lens context
generated: 2026-04-01T14:45:14.982Z
entry: src/app/areas/shared/util-auth/store.ts

---

## The ask

I'm working on the `Store` component in an Angular application and want to
create MSW mock scenarios for the endpoints it depends on.

Based on the source files below, please:

1. Identify the HTTP endpoints this component reaches (through its store or service)
2. For each endpoint, generate a `.yaml` manifest in msw-lens format
3. For each endpoint, also generate a handler stub (`.ts`) with a switch statement
   over the scenario names — match the pattern in the existing manifests
4. For each scenario, cover: happy path, empty/null states, error conditions
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

### store.ts
`src/app/areas/shared/util-auth/store.ts`
```typescript
import { signalStore, withComputed, withMethods, withProps } from '@ngrx/signals';
import { computed } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { AuthUser } from './internal/types';

export const authStore = signalStore(
  withProps(() => {
    return {
      authResource: httpResource<AuthUser>(() => '/api/user/'),
    };
  }),
  withMethods(() => {
    return {
      login: (redirectUrl: string) => {
        console.log('Logging in, redirect to:', redirectUrl);
      },
      logout: (redirectUrl: string) => {
        console.log('Logging out, redirect to:', redirectUrl);
      },
    };
  }),
  withComputed((store) => {
    return {
      isLoggedIn: computed(() => !!store.authResource.value()),
    };
  }),
);
```

### types.ts
`src/app/areas/shared/util-auth/internal/types.ts`
```typescript
export type AuthUser = {
  sub: string;
  name: string;
  given_name: string;
  family_name: string;
  preferred_username: string;
  email: string;
  role: string[];
};
```

---

## Existing manifests (pattern reference)

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
    delay: realistic

  server-error:
    description: Auth service is unavailable — tests error boundary or fallback UI behavior
    httpStatus: 500

  admin:
    description: User with an elevated Admin role — tests role-based UI variations (nav items, gated features)
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
- `slow` — MSW delay:realistic, tests loading/skeleton states
- `malformed-data` — response missing optional fields or with unexpected nulls

**Collection endpoints** (array/list responses):
- `typical` — N items, normal case
- `empty` — zero items, tests empty-state UI
- `overloaded` — far more items than the UI was designed for (tests pagination, overflow)
- `slow` — tests loading skeleton
- `unauthorized` — 401
- `server-error` — 500
