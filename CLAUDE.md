# msw-tui — Project Context for Claude

This file is owned and maintained by Claude. Jeff will not edit it.

## What This Project Is

A developer tool for switching between MSW (Mock Service Worker) scenarios without manually editing handler files. The "eye doctor experience" — flip between scenarios quickly to test how your UI handles different data shapes, error states, and timing conditions.

Intended to ship as an `npx`-able TUI. Built alongside an Angular starter app that demonstrates the concept.

## The Core Insight

**The manifest file IS the prompt.** The scenario manifest (YAML, co-located with each handler) is designed to be self-sufficient as LLM context. A developer drops it into any LLM conversation and asks "what scenarios am I missing?" — no narration required. The manifest structure does the work.

This mirrors the design principle from the companion project [Stellar Devtools](https://stellar.hypertheory-labs.dev): design for AI legibility first, human legibility comes almost for free.

## Design Principles

1. **Augment, don't replace.** Every feature decision should ask: does this make the developer more capable, or does it just do a thing for them? (Jeff calls this the Butlerian Jihad principle.)
2. **sourceHints, not narration.** Give an LLM navigational pointers to relevant source files. It derives understanding from the actual code — developers shouldn't manually write context summaries.
3. **Two modes, one tool.** Creation/interview mode (scaffold a manifest + handler) and operational/switching mode (the eye doctor switcher) are conceptually distinct even if they live in the same binary.

## Key Files

```
src/app/__mocks__/
  active-scenarios.ts       ← runtime state; TUI writes this; Vite HMR picks it up
  handlers.ts               ← aggregates all handlers
  browser.ts                ← MSW worker setup
  auth/
    user.ts                 ← example handler with scenario switching
    user.yaml               ← example manifest (the design artifact)
design-notes/               ← extended thinking; read these before designing anything
  01-core-concepts.md
  02-format-and-self-description.md
  03-validation-and-principles.md
  04-manifest-format.md
```

## Current State

- Manifest format: designed and validated against the auth/user endpoint
- Scenario switching mechanism: implemented (`active-scenarios.ts` → handler switch statement)
- HMR behavior: **VERIFIED** — manually edited `active-scenarios.ts`, Vite reloaded, handler switched correctly end-to-end.
- TUI: not started — next up

## Manifest Format (current shape)

```yaml
endpoint: /api/user/
method: GET
shape: document  # document | collection — unlocks appropriate scenario vocabulary
description: Human-readable description of what this endpoint returns

responseType:
  name: TypeScriptTypeName
  path: relative/path/to/types.ts

context:
  sourceHints:        # paths to files that consume this endpoint
    - path/to/store.ts
    - path/to/component.ts

scenarios:
  scenario-name:
    description: What this tests and why it matters for the UI
    active: true       # default scenario
    httpStatus: 401    # optional
    delay: realistic   # optional — MSW delay mode
```

## Open Design Questions

- Does one scenario span multiple endpoints, or is the manifest per-endpoint? (Current: per-endpoint)
- Can scenarios compose? ("slow" + "401" simultaneously)
- Should `active` live in the manifest (as default declaration) AND in `active-scenarios.ts` (as runtime state)? Currently split — feels right but slightly redundant.
- The TUI will need a "self-describe" output (like Stellar's `describe()`) — a generated file explaining the tool and current project state, droppable into any LLM conversation.
- Pre-built prompt output: TUI mode that generates manifest + sourceHint file contents + a targeted question, ready to paste.

## Tech Decisions

- **TypeScript/Node** for the TUI (npx ecosystem fit; students don't need separate installs)
- **YAML** for manifests (comment support; direct editability; LLMs handle it fine)
- **`active-scenarios.ts`** not JSON — avoids `resolveJsonModule` tsconfig changes; plain TS module that Vite HMR handles naturally; TUI writes it by regenerating the file from a template
- **No VS Code extension** — TUI is editor-agnostic, works for all students regardless of editor
