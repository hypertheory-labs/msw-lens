/**
 * Canonical reference for the msw-lens manifest format. Imported by
 * generate-context.ts (rendered in .msw-lens/context.md) and generate-prompt.ts
 * (rendered in the per-component LLM prompt). Each consumer adds its own
 * heading so the document hierarchy stays well-formed.
 */
export const MANIFEST_FORMAT_BODY = `\`\`\`yaml
endpoint: /api/resource/   # MUST match the handler's ENDPOINT constant exactly
method: GET
shape: document            # document | collection — determines scenario vocabulary
description: What this endpoint returns

responseType:              # the success-response type
  name: TypeScriptTypeName
  path: relative/path/to/types.ts   # path relative to where you run \`lens:context\`

errorType:                 # optional — 4xx/5xx response shape (e.g. RFC 9457 ProblemDetails)
  name: ProblemDetails
  path: relative/path/to/types.ts

context:
  sourceHints:             # paths to files that consume this endpoint
    - path/to/store.ts     # LLM reads these directly — provide pointers, not summaries
    - path/to/component.ts
  hints:                   # optional — free-form annotations the code doesn't make obvious
    - "401 always redirects to /login via a route guard"
    - "quantity must be between 1 and 99"

scenarios:
  scenario-name:
    description: What UI behavior this tests (not what the data looks like)
    active: true           # at most one scenario per manifest — marks the default
    httpStatus: 401        # optional — omit for 200
    delay: real            # optional — 'real', 'infinite', or integer-string ms ('2000')
\`\`\`

Four things are non-negotiable:

1. **\`endpoint\` MUST match the handler's \`ENDPOINT\` constant exactly.** The switcher writes keys to \`active-scenarios.ts\` as \`METHOD endpoint\` (e.g. \`GET /api/cart\`); the handler reads keys in the same format. A mismatch is silent — the handler falls through to its default case forever and the switcher appears to do nothing.

2. **\`shape\` is \`document\` or \`collection\` — literal values.** It determines which scenario archetypes apply (single-item vs list).

3. **At most one scenario has \`active: true\`** — and you should always specify one. The fallback (first scenario in declaration order) reorders silently when the manifest is edited.

4. **\`delay\` is one of:** \`real\` (realistic latency), \`infinite\` (never resolves — tests timeout UI), or an integer-string of milliseconds (\`"2000"\`).
`;
