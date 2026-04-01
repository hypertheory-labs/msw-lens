# msw-lens — project context
generated: 2026-04-01T15:32:44.969Z

> Drop this file into any LLM conversation for instant context about what
> is mocked in this project, what scenarios exist, and what is currently active.

## Active scenarios

| endpoint | method | active scenario |
|----------|--------|-----------------|
| `/api/user/` | GET | `logged-in` |

## Scenario details

### GET `/api/user/`
manifest: `src/app/__mocks__/auth/user.yaml`
> Currently authenticated user profile

- **logged-in** ✓ **(active)** — Authenticated user with Student and Employee roles — the happy path
- **logged-out** *(401)* — No active session — tests that auth guards redirect correctly and login UI appears
- **slow** *(delay: realistic)* — Simulates a sluggish auth service — tests loading skeleton states in consuming components
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
    delay: realistic    # optional — MSW delay mode
```
