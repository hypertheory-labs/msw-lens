# Manifest Format

## The sourceHints Pattern (from Stellar)
The Stellar `sourceHint` field teaches the right lesson: give an LLM navigational pointers, not narrated summaries. Without sourceHints, an LLM knows the scenario shapes but not where the consuming code lives — so suggestions are generic. With sourceHints, it can read the actual files and reason specifically.

Applied here: `context.notes` is wrong. It asks the developer to manually narrate something the LLM can derive by reading source files. Replace it with `context.sourceHints` — an array of paths to files that consume or depend on this endpoint (store, component, guard, whatever). The developer provides pointers. The LLM supplies understanding.

## The "Explain This" Output
The TUI's "explain this to Claude" mode generates:
- The manifest (YAML)
- The contents of every file listed in `sourceHints`
- A pre-built prompt asking the specific question

Not summaries. The actual files. The format does the rest — same principle as Stellar recordings.

## Current Manifest Shape

```yaml
endpoint: /api/user/
method: GET
shape: document  # document | collection
description: ...

responseType:
  name: TypeScriptTypeName
  path: relative/path/to/types.ts

context:
  sourceHints:
    - path/to/consuming/store.ts
    - path/to/consuming/component.ts

scenarios:
  scenario-name:
    description: What this tests and why it matters for the UI
    active: true          # only one active at a time
    httpStatus: 401       # optional — omit for 200
    delay: realistic      # optional — MSW delay mode
```

## Open Design Questions
- Does one scenario span multiple endpoints, or is the manifest per-endpoint? (Current: per-endpoint)
- Can scenarios compose? ("slow" + "401" simultaneously)
- The `admin` scenario is a *data variation*, not a *failure mode* — does that deserve a different category/label?
- Should `active` live in the manifest or only in `active-scenarios.ts`? (Currently split — manifest has it as default, active-scenarios.ts is runtime state)

## File Placement
Manifests live alongside their handlers: `src/app/__mocks__/auth/user.yaml` next to `src/app/__mocks__/auth/user.ts`. Co-location makes the relationship obvious.
