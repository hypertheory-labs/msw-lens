# Custom Handlers, Passthrough, and Mutations

## The Problem

msw-lens manages scenario-switched GET handlers. But real apps also have:

- **Mutations** — POST/PUT/PATCH/DELETE that change server state
- **Stateful mocks** — handlers that need shared in-memory state (e.g. a POST that affects a subsequent GET)
- **Third-party endpoints** — things the tool has no manifest for

These need to coexist with lens-managed handlers without fighting them.

---

## Custom Handlers Convention

One extension point: `__mocks__/custom/index.ts`, default export of `HttpHandler[]`.

`handlers.ts` composes:

```ts
import customHandlers from './custom';
// ...lens-managed handlers...

export default [...customHandlers, ...lensHandlers];
```

Custom handlers go **before** lens handlers — they win on any conflict. This is the right default: if you've written a custom handler for an endpoint, you want it to fire.

**Deliberately not built:** a `before/after` split. That pre-builds infrastructure for a problem that hasn't appeared yet. One extension point; if someone needs ordering control they can do it explicitly in `handlers.ts`.

---

## The "None" Scenario

Every lens-managed endpoint gets a reserved `none` option in the TUI (rendered as `[none]`, visually distinct, listed first).

When active scenario is `none`, the handler calls MSW's `passthrough()`:

```ts
if (scenario === 'none') return passthrough();
```

`passthrough()` sends the request to the **real network** — not to the next MSW handler. This matters:

### Two distinct "none" use cases

**1. Hit the real API**
Developer is doing an eye test against a real staging/dev server for this endpoint. Lens steps aside completely. This is the primary use case.

**2. Let custom handlers take over**
This does NOT work via `none`. Custom handlers are registered *before* lens handlers in the array — they always fire first regardless of the lens scenario. If you want a custom handler to own an endpoint, register it in `custom/index.ts` and it wins by position, not by setting lens to `none`.

The implication: `none` means "go to the network." It does not mean "go to my custom handler." Custom handler ownership is structural (position in handler array), not a scenario selection.

### Why "none" is still valuable

Without it, the TUI implies everything is always mocked. With it, you can see at a glance what's live vs. intercepted. That's honest and useful when working against a real backend for some endpoints while mocking others.

---

## Mutations — Design Decision

**School 1 (chosen): Stateless scenarios per mutation.**

Mutation handlers follow the same pattern as GET handlers — scenario controls what the handler returns (success, failure, slow, validation error) but does not affect shared state. The GET for the same resource has its own independent active scenario.

This is right for this tool's purpose. msw-lens scenarios exist to test *UI behavior*, not to simulate a faithful backend. A scenario like "add to cart fails — item out of stock" tests whether the UI shows an error message. You don't need a stateful GET to test that.

**School 2 (deferred): Stateful in-memory mock backend.**

Shared state in the MSW worker. POST mutates it, GET reads it. Full end-to-end fidelity. Not in scope for this tool — `custom/index.ts` is the escape hatch for teams that want this.

---

## Mutation Manifest Design

`shape` does not apply to mutations — it describes response structure, and mutations don't have one in the same sense. The method (`PATCH`, `DELETE`, `POST`) is sufficient to imply the scenario vocabulary.

Scenario vocabulary for mutations:
- `success` — happy path (active by default)
- `validation-error` — 400, malformed or invalid request
- `conflict` — 409, state conflict (already exists, etc.)
- `server-error` — 500
- `slow` — delay: real

`responseType` is optional — many mutations return no body. For PATCH specifically, the decision was **202 Accepted, no body** — PATCH has no agreed-upon response format, so 202 keeps it honest and lets the store update optimistically without modeling response state.

`errorType` points at the `ProblemDetails` type (or equivalent). An LLM reading the sourceHints will use this type to generate realistic error response bodies for 400/409/500 scenarios. This is the sourceHints principle applied to error responses — **don't enumerate error payloads in the manifest, point at the types**.

The interesting test here: drop a mutation manifest into a fresh LLM conversation and observe what error body it generates for the `validation-error` scenario. If it produces a realistic `ProblemDetails` envelope from the type reference alone, the format is working. If it invents something unrelated, the sourceHints need to be stronger.

### Store pattern for mutations

Optimistic update, fire-and-forget. The store patches local state immediately, then fires the HTTP request in the background. No rollback for demo purposes — a failed mutation leaving stale UI is itself a scenario worth observing.

```ts
incrementQuantity: async (id: string) => {
  const item = state.entityMap()[id];
  if (!item) return;
  patchState(state, updateEntity({ id, changes: { quantity: item.quantity + 1 } }));
  await fetch(`https://store.company.com/user/cart/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ quantity: item.quantity + 1 }),
  });
},
```

Decrement to 0 calls `removeItem` instead — the store enforces the invariant, not the server.

### Concrete endpoints (shopping cart demo)

- `PATCH https://store.company.com/user/cart/:id` — update quantity → 202 Accepted
- `DELETE https://store.company.com/user/cart/:id` — remove item → 204 No Content
