# Core Concepts

## The Central Insight (Jeff's, found in conversation)
The manifest file IS the prompt. Not "fill out the interview, then trigger the LLM." The output of the interview is a structured file that contains everything an LLM needs to generate handlers. The developer drops it in a conversation. No special trigger mechanism needed.

This is the same discovery made in Stellar: design for AI legibility first, and human legibility comes almost for free. The manifest serves both msw-lens (reads it to display scenarios) and the LLM (reads it to understand context and generate/critique handlers).

## Two Distinct Modes
The tool has two conceptually separate functions that happen to live in the same binary:

1. **Creation/Interview mode** - collects information about an endpoint, generates the manifest, possibly scaffolds handler stubs. Probably run once per endpoint by the developer/instructor.
2. **Operational/Switching mode** - reads the manifest, displays available scenarios, lets the developer switch the active one. This is the "eye doctor" experience. Writes the active scenario selection, HMR picks it up.

In a course context: instructor likely runs interview mode during setup. Students mostly use switching mode (`npm run lens`).

## The Document vs. Collection Question
Early in the interview: "Is this a document (single item) or a collection (list)?"

This single bit of information unlocks the appropriate scenario vocabulary:
- **Collection** → empty, typical (N items), overloaded (stress test pagination), slow, 401, 500
- **Document** → not-found (404), different status values, partial/malformed data, slow, 401, 500

## The Minimum Information Set (open question)
What does the interview need to collect so the manifest is self-sufficient as LLM context?

Candidates:
- Endpoint path
- HTTP method
- Response type (TypeScript type name + relative path to the file)
- Document vs. collection
- Consuming component (relative path) — optional but high-value for gap analysis
- Story card / ticket reference — optional, gives LLM product intent context
- Which scenario archetypes to scaffold (checkboxes: happy path, empty, slow, error states)

## Backlog

- **`--only <filter>` flag** — filter the switcher to a subset of endpoints when working
  with a large number of manifests. Match on endpoint path fragment or manifest directory
  name (e.g. `--only cart`, `--only /api/user/`). Endpoints not matched stay at their
  current active scenario, untouched. Build when the pain is real — probably 10+ endpoints.

- **Configurable `__mocks__` root** — currently opinionated to convention. `package.json`
  config option for projects that deviate. Build when someone needs it.

- **`--only` in lens:context** — analogous filter for context generation. "Generate prompt
  for just the cart store, even though I have 15 manifests already." Reduces pattern
  reference bloat as project matures.

## HMR Mechanism
msw-lens writes the active scenario selection to `src/app/__mocks__/active-scenarios.ts` — a plain TS module (`Record<string, string>`, keyed by endpoint path). Handlers import it and switch on the value. Vite HMR picks up the file change and hot-reloads. **Verified working.**

Decision to use `.ts` not `.json`: avoids `resolveJsonModule` tsconfig changes; plain TS module that Vite HMR handles naturally. msw-lens regenerates the file from a template on every write — it owns this file entirely.
