# Design Note 10 — The Manifest as Consumer-Driven API Contract

## The Core Reframe

The manifest is not just MSW scenario configuration. It is a **frontend-first API contract** — a description of what the frontend needs, expressed before the backend exists.

Traditional flow: backend defines contract → frontend implements against it.  
msw-lens flow: frontend declares what it needs → backend is written in response.

This is consumer-driven contract testing (à la Pact), but expressed as *intent* rather than derived from interactions. The manifest describes the contract before any real implementation exists on either side.

## Two Layers of the Tool

This suggests the tool has two distinct value propositions that can coexist cleanly:

**Layer 1 — Useful without thinking about it.**  
Scenario switching + context generation. Drop manifests next to handlers, run `lens`, flip scenarios. No schema knowledge required. The tool is immediately useful.

**Layer 2 — Optional richer schema for AI-assisted backend generation.**  
Additional YAML fields that carry hints for a cold LLM generating the API. These fields are optional — Layer 1 works without them. But when present, they enable a second workflow: hand the manifest to an LLM and ask it to generate the backend endpoint, authorization logic, and contract tests.

Progressive disclosure of complexity. Basic users get the switcher. Advanced users get a contract format.

## What the Richer Schema Might Include

Fields already present (Layer 1 baseline):
- `endpoint`, `method`, `shape`
- `responseType` — name + path of the TypeScript type
- `errorType` — name + path of the error type (RFC 9457 ProblemDetails)
- `scenarios` — with `httpStatus`, `delay`, `description`
- `context.sourceHints` — files that consume this endpoint

Fields worth adding for Layer 2 (auth + backend generation hints):
```yaml
auth:
  required: true
  roles: [admin]          # roles that can access this endpoint
  mechanism: cookie       # cookie | bearer | api-key | none

requestBody:              # for POST/PUT/PATCH
  name: TypeScriptTypeName
  path: relative/path/to/types.ts

idempotent: false         # safe to retry? affects backend implementation + test strategy
sideEffects:              # what does this mutation change?
  - inventory.items
  - audit.log
```

## Why Auth Metadata Belongs Here (Even for Cookie Auth)

For a BFF/cookie auth pattern, the MSW handler itself doesn't inspect auth headers — the active `user.yaml` scenario controls who's "logged in." The route guard handles navigation protection. So auth metadata has no effect on the mock handler.

But it IS useful to the "other universe" LLM generating the backend:
- Knows to add `[Authorize(Roles = "admin")]` or equivalent
- Knows to generate a Playwright test: "user without admin role cannot navigate to this form"
- Knows to generate a contract test: "POST without valid session returns 401"

The metadata is silent to the mock layer but loud to the backend generation layer.

## The Consumer-Driven Workflow This Enables

1. Frontend developer builds form + store (no backend yet)
2. Runs `lens:context` → generates `prompt.md` with full source context
3. Writes manifest with Layer 2 fields (auth, requestBody, sideEffects)
4. Hands `prompt.md` + manifest to a cold LLM instance
5. LLM generates: backend endpoint stub, auth middleware, Playwright test, contract test

The frontend gets ahead of the backend. The manifest is the specification. The LLM implements both ends.

## Relationship to Stellar

Stellar observes app state and records causal chains. msw-lens controls mock conditions. Together they close the loop:

- msw-lens manifest → backend contract (what the API should do)
- Stellar recording → Playwright test (what the UI actually does)

A cold LLM instance with both can generate a complete acceptance test: given this mock state, trigger this user action, assert this causal chain. The AI participates in the full development cycle, not just code generation.

## The `hints` Field — Freeform Escape Hatch

Structured fields are good for things the tool or schema can anticipate. But some knowledge is irregular, contextual, and doesn't fit a controlled vocabulary. For that: `hints`.

```yaml
hints: "This endpoint feeds a dynamic lookup — latency matters more than richness. Suggest scenarios that stress response time."

scenarios:
  slow:
    description: Sluggish response from cache miss
    hints: "The Playwright test should assert the dropdown shows a spinner, not a stale list."
```

`hints` can appear at the manifest level (about the endpoint as a whole) or at the scenario level (about a specific condition). The tool ignores it entirely — `discover.ts` never reads it. It is addressed directly to the LLM reader in the other universe.

This makes the schema non-limiting. Structured fields handle the common cases with autocomplete-aided discovery. `hints` handles everything else in plain language.

## YAML as Cognitive Scaffolding

An important design observation: the structured format serves the *human author* more than the LLM reader. An LLM understands plain English at least as well as it understands YAML. The schema is not a technical requirement for LLM comprehension — it is a UX decision.

The blank-cursor problem is real: developers staring at a freeform input freeze. Give them a field labeled `auth.roles` and they think "oh — what roles does this endpoint need?" — a question they would never have surfaced unprompted. The schema acts as a question-asker, prompting developers to surface knowledge they already hold but wouldn't have thought to express.

In this sense, the manifest is "prompting for dummies" — but more charitably, *cognitive scaffolding*. The schema does the metacognitive work so the developer just has to answer. The `hints` field is the release valve: once the schema has gotten them thinking, they can overflow into plain language for anything the schema didn't anticipate.

The deeper meta-point: this project is a demonstration that the right AI tooling helps *humans* communicate better, rather than constraining or "persona-izing" the LLM. The tool is a human aid. The LLM is trusted to do its job.

## Open Questions

- Should `requestBody` be inferred from `sourceHints` (the store's `post()` call) or declared explicitly?
- How specific should `sideEffects` be? Free-form strings, or a controlled vocabulary?
- Should the manifest schema be formally validated (JSON Schema / zod)? This would let editors provide autocomplete and catch typos in field names.
- Is there a publish step? Could `prompt.md` + manifest be posted to a shared endpoint for async backend generation? (Probably out of scope, but the architecture supports it.)
