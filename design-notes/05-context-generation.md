# Context Generation — lens:context Mode

## The Central Insight
The switcher is real and useful, but the context generator is the feature that matters most. The switcher makes scenarios useful in daily work. The context generator makes scenarios worth creating in the first place.

## Validated Confidence Baseline (from Stellar)
A completely cold LLM — no CLAUDE.md, no memories, no prior context — was given only
Stellar's `describe()` output and an HTTP recording. It:
- Drew diagrams explaining the full app architecture
- Explained how the stores and HTTP layer related
- Proactively identified a potential race condition the developer hadn't asked about

This is the bar for msw-lens context output: not just "enough to generate a manifest" but
**"rich enough that the LLM notices things the developer didn't think to ask about."**

The race condition find happened because the recording preserved causal structure. The LLM
could see timing relationships and infer risk. For msw-lens, the analog is: if the template
shows `*ngIf="items.length > 0"` and the type says `items: CartItem[] | null`, a LLM seeing
both can say "you need a null scenario, not just an empty array scenario — those behave
differently here." Only possible if the template is in the context.

## The Design Constraint
When designing the output format, think from the *receiving* LLM's perspective.
"If I received this file cold, with no other context — would I be set up for success?
What would trip me up?"

## Command
`npm run lens:context <component-file>`

Example: `npm run lens:context src/app/shopping-cart/shopping-cart.component.ts`

Output: `.msw-lens/prompt.md` — committed, tool-owned, regenerated on each call.

## File Discovery Strategy
Starting from the entry component:
1. Component `.ts` — always included
2. Component `.html` — always included if exists (this is where failure modes live)
3. Stores/services imported by the component — follow relative imports only, skip node_modules
4. Type files imported by those stores/services — one more level deep

Typically 3-5 files total. **Full contents always. No summaries, no excerpts.**

## Output Format: .msw-lens/prompt.md

```markdown
# msw-lens context
generated: <ISO timestamp>
entry: <relative path to component>

---

## The ask

I'm working on the <ComponentName> component in an Angular application and want to
create MSW mock scenarios for the endpoints it depends on.

Based on the source files below:
- Identify the HTTP endpoints this component reaches (through its store/service)
- Generate a `.yaml` manifest file (in msw-lens format) for each endpoint found
- For each endpoint, also generate a handler stub (`.ts`) with a switch statement
  over the scenario names in the manifest
- For each scenario, suggest coverage across: happy path, empty/null states, error
  conditions (with appropriate HTTP status codes), slow/timeout conditions, and edge
  cases the response type shape suggests I haven't anticipated

**For scenario descriptions:** say what UI behavior it tests, not just what the data
looks like. Example: "Tests that the cart icon badge disappears and the checkout button
disables when items returns empty array" — not "Returns an empty items array."

Use the format and vocabulary shown in the existing manifests below.

---

## Source files

### <filename>
`<relative path>`
<full file contents>

[... repeated for each discovered file ...]

---

## Existing manifests (pattern reference)

### <manifest filename>
`<relative path>`
<full yaml contents>

[... repeated for each discovered manifest ...]

---

## About msw-lens

msw-lens manages MSW scenario switching for Angular development. Manifests live
alongside handlers in `__mocks__` directories. The active scenario is written to
`src/app/__mocks__/active-scenarios.ts` — Vite HMR picks it up immediately.

Scenario archetypes to consider:

**Document endpoints** (single item responses):
- `happy-path` — successful response with typical data
- `not-found` — 404, resource doesn't exist
- `unauthorized` — 401, tests auth guards and login redirect
- `server-error` — 500, tests error boundary / fallback UI
- `slow` — MSW delay('real'), tests loading states
- `malformed-data` — response missing optional fields or with nulls where not anticipated

**Collection endpoints** (array/list responses):
- `typical` — N items, normal case
- `empty` — zero items, tests empty state UI
- `overloaded` — far more items than the UI was designed for (tests pagination, overflow)
- `slow` — tests loading skeleton
- `unauthorized` — 401
- `server-error` — 500
```

## What the LLM Should Output
The prompt asks for two artifacts per endpoint:
1. `<endpoint-name>.yaml` — the manifest with scenarios and descriptions
2. `<endpoint-name>.ts` — handler stub implementing the switch statement

This gives the developer everything needed to wire it up. One conversation, complete output.

## What This Enables (the race-condition-level finds)
A LLM with full component + template + types can catch:
- Null vs empty array mismatches (`items: null` vs `items: []` behave differently in templates)
- Missing loading state scenarios (template has skeleton but no slow scenario exists)
- Role-based UI gaps (template has `*ngIf="isAdmin"` but no admin scenario in the manifest)
- Data shape assumptions (component accesses `response.user.name` but `user` is nullable)

These are the findings the developer didn't ask for. They happen because the format is rich
enough to reason beyond the explicit question.

## The Legibility Guarantee — and Its Edges

*From cold-instance peer review of the cart experiment:*

The context generation works well when endpoints are visible as literal strings in the
crawled source files. The absolute URL (`https://store.company.com/user/cart`) was readable
because it was hardcoded in the store's fetch call — follow-imports found it directly.

But there is a class of Angular patterns where the endpoint URL won't appear in the crawled
files:
- `HttpClient` with a base URL injected from an environment token
- Interceptors that rewrite paths at runtime
- Service abstractions where the URL is assembled from parts

In these cases, the tool hands the LLM everything it can find, and the URL is still opaque.
The LLM will see the service call but not the resolved endpoint.

**This is not a bug in the tool — it's a map of its territory.**

The legibility guarantee is: *if the endpoint URL is visible as a literal in the crawled
files, the tool provides sufficient context.* When it isn't, the developer needs to provide
the URL manually — either in the prompt or by designing their stores to make endpoints
discoverable (a good practice regardless).

The absolute URL also surfaced a secondary note: the endpoint key in `active-scenarios.ts`
must match exactly what MSW intercepts. Absolute URLs work fine in MSW, but the key must be
the full URL, and a base URL change requires updating both the store and the handler.

## Open Questions
- Should the prompt explicitly request Playwright test suggestions? (Stellar's cold instance
  offered this unprompted — we could make it a first-class ask)
- Should `.msw-lens/prompt.md` be regenerated on every `lens` run, or only on explicit
  `lens:context` invocation? (Leaning toward: only on explicit invocation — it's
  component-specific, not project-global)
- Multi-endpoint components: generate one manifest file per endpoint found, or one combined?
  (Leaning toward: one per endpoint — matches the existing per-endpoint manifest convention)
