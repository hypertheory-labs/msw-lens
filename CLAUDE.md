# msw-lens — Project Context for Claude

This file is owned and maintained by Claude. Jeff will not edit it.

## What This Project Is

A developer tool with two jobs:

1. **Scenario switcher** — flip between MSW mock scenarios without editing files. The "eye doctor experience." Writes `active-scenarios.ts`; Vite HMR picks it up instantly.

2. **Context generator** — assembles the source files an LLM needs to suggest scenarios for a component, inlines them, and writes a ready-to-paste prompt. This is the feature that matters most.

The switcher is real and useful. The context generator is why this project exists.

Ships as `npx`-able tool: `@hypertheory-labs/msw-lens` on npm. The repo is a monorepo containing the package (`packages/msw-lens/`) plus framework demos (`apps/angular-demo`, `apps/react-demo`, eventually `apps/vue-demo`) that exercise it end-to-end.

## The Core Insight

**The manifest file IS the prompt.** The scenario manifest (YAML, co-located with each handler) is self-sufficient as LLM context. Drop it into any conversation — no narration required. The structure does the work.

This mirrors [Stellar Devtools](https://stellar.hypertheory-labs.dev): design for AI legibility first, human legibility comes almost for free. Stellar = observe app state. msw-lens = control mock conditions. Together they form a feedback loop an LLM can participate in.

## Design Principles

1. **Augment, don't replace.** Every feature decision should ask: does this make the developer more capable, or does it just do a thing for them? (The Butlerian Jihad principle.)
2. **sourceHints, not narration.** Give an LLM file paths. It derives understanding from the actual code — developers shouldn't manually write context summaries.
3. **Full contents, not summaries.** When assembling LLM context, inline the actual files. An LLM reading the real code finds things a summary would miss (null vs empty array, race conditions, role-gated UI).
4. **Committed, tool-owned files (in user projects).** In real consumer projects, files msw-lens generates (`.msw-lens/context.md`, `active-scenarios.ts`) are committed so a new LLM instance reading the repo has context immediately. Exception: this repo's demo apps gitignore `apps/*/.msw-lens/` because the tool itself is documented in `docs/` and `design-notes/` — the demo-app artifacts would just add noise to git.

## Repo Layout

```
packages/msw-lens/           ← the published npm package (@hypertheory-labs/msw-lens)
  src/
    index.ts                 ← entry point; handles all three modes
    discover.ts              ← glob + parse manifests
    state.ts                 ← read/write active-scenarios.ts
    follow-imports.ts        ← crawl relative imports from a component file
    generate-context.ts      ← builds .msw-lens/context.md
    generate-prompt.ts       ← builds .msw-lens/prompts/<component>.md
    config.ts                ← reads msw-lens config from package.json
  schema/                    ← manifest.schema.json (ships with the package)

apps/
  angular-demo/              ← Angular 21.2 + Tailwind + DaisyUI; two Cart components (inline + templateUrl)
  react-demo/                ← Vite + React 19 + Tailwind + DaisyUI; single Cart component
  vue-demo/                  ← (coming with 0.2.0 — needs .vue import resolution in lens)
  demo.sh                    ← creates a throwaway branch + scrubs generated artifacts, for clean-slate demos

design-notes/                ← extended thinking; read before designing anything
docs/                        ← user-facing content (markdown; drops into Jeff's Astro Starlight site)
```

## Per-demo structure

```
apps/<framework>-demo/
  src/
    main.ts|tsx              ← MSW-gated bootstrap (gated on env.addMsw for Angular, import.meta.env.DEV for Vite)
    mocks/                   ← msw-lens default mocksDir (matches MSW-idiomatic layout)
      browser.ts             ← setupWorker — permanent, never touched by reset
      handlers.ts            ← aggregator — reset to empty on clean slate
      active-scenarios.ts    ← tool-owned runtime state
      <endpoint>/<endpoint>.ts    ← handler with scenario switch
      <endpoint>/<endpoint>.yaml  ← manifest (sibling to handler)
    app/features/<feature>/  ← Angular
    features/<feature>/      ← React
  package.json               ← minimal; just lens scripts (deps live at root)
  project.json               ← Nx target wiring
  .msw-lens/                 ← gitignored in this repo; committed in user projects
```

## Commands

Run from inside a demo app (`cd apps/angular-demo`):

```bash
npm run lens                                      # interactive switcher, single run
npm run lens:watch                                # stay in switcher, ctrl+c to exit
npm run lens:context -- <path/to/component.ts>   # generate .msw-lens/prompts/<component>.md
```

Monorepo maintainer commands (run from root):

```bash
npm run build:lens                # build packages/msw-lens/
npx nx serve angular-demo         # dev server
npx nx build angular-demo         # production build
apps/demo.sh [branch-name]        # start a demo run on a throwaway branch
```

## Demo Parity

The demos must stay in idiomatic parity as scenarios are added. When Jeff adds a `foo` feature to `apps/angular-demo`, the same feature should exist in `apps/react-demo` and (once it exists) `apps/vue-demo`.

**Parity means same behavior, idiomatic to each framework:**
- Same endpoint URL and response shape
- Same scenario names (`typical`, `empty`, `unauthorized`, `server-error`, `slow`, etc.) with matching descriptions
- Same switch structure in the handler
- Mirror the feature layout: Angular `src/app/features/<feature>/`, React `src/features/<feature>/`
- Manifest identical except `responseType.path` and `sourceHints` (framework-specific file paths)

**Parity does NOT mean line-for-line port:** Angular uses services + signals, React uses hooks, Vue will use composables. The idiom differs; the demonstrated scenarios don't.

When Jeff says "bring the other demos to idiomatic parity with X," the workflow is:
1. Read the source in the reference app (usually angular-demo)
2. Read one existing parity example in each target to learn that app's idioms
3. Port the feature to each target, writing code that looks native to that framework
4. Copy the manifest, adjust only the paths
5. Copy the handler's scenarios, keeping names and switch structure identical

## Manifest Format

```yaml
# yaml-language-server: $schema=https://unpkg.com/@hypertheory-labs/msw-lens/schema/manifest.schema.json

endpoint: /api/resource/
method: GET
shape: document             # document | collection — determines scenario vocabulary
description: Human-readable description of what this endpoint returns

responseType:
  name: TypeScriptTypeName
  path: relative/path/to/types.ts

context:
  sourceHints:              # paths to files that consume this endpoint
    - path/to/store.ts
    - path/to/component.ts

scenarios:
  scenario-name:
    description: What UI behavior this tests (not just what the data looks like)
    active: true            # default scenario
    httpStatus: 401         # optional
    delay: real             # optional — MSW delay mode
```

## Current State

- Published: `@hypertheory-labs/msw-lens@0.1.0` on npm (2026-04-24)
- Uncommitted on main: `__mocks__` wording fix in generate-context.ts / generate-prompt.ts (ships as 0.1.1)
- Scenario switching: working
- `lens:context`: working
- Angular + React demos: both build, both serve, both exercise the msw-lens flow end-to-end
- Vue demo: deferred to 0.2.0 (requires `.vue` import resolution)
- Docs: not started; will be markdown-only, drops into Jeff's Astro Starlight site

## Open Design Questions

- Can scenarios compose? ("slow" + "401" simultaneously)
- Creation/interview mode: how does the developer bootstrap the first manifest for an endpoint?
- Should `lens:context` also suggest Playwright tests? (Stellar's cold-instance found a race condition unprompted — this capability exists if we frame the ask right)
- Multi-endpoint components: one prompt file covering all endpoints, or one per endpoint?
- **`shape` field is ambiguous for wrapped-envelope responses.** Every cold Claude labels Cart as `shape: document` even though `{ items: [], total: N }` contains a collection. The envelope IS a document; the payload IS a collection. Options for 0.2.0: rename the field, add `shape: mixed`, or split into `envelope` + `payload`. Defer until Vue demo forces the issue or a clearer pattern emerges.

## Tech Decisions

- **TypeScript/Node** for the tool (npx ecosystem fit)
- **YAML** for manifests (comment support; LLMs handle it fine; directly editable)
- **`active-scenarios.ts`** not JSON — avoids `resolveJsonModule` tsconfig changes; Vite HMR handles it naturally
- **Default `mocksDir: src/mocks`** — MSW-idiomatic layout; override via per-app `package.json` "msw-lens" block if using `src/app/__mocks__` or other conventions
- **Default `templateExtension: null`** — works out of the box for React, Vue, Svelte. Angular users set `".html"` to discover sibling templates
- **Deps live at root, not per-app** — Nx-style hoisting. Per-app package.json is minimal (just scripts)
- **`.msw-lens/` gitignored in `apps/*/`** — noise in this repo; commit in user projects
- **No VS Code extension** — editor-agnostic; works for all students regardless of editor
