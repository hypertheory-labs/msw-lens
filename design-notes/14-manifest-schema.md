# Design Note 14 — Manifest JSON Schema

## What It Is

`lens/schema/manifest.schema.json` is a JSON Schema (draft-07) for the YAML manifest files.
It's picked up by the Red Hat YAML extension in VS Code and provides autocomplete, hover
documentation, and soft validation for any manifest file.

The schema ships with the package and is published at:
```
https://unpkg.com/@hypertheory-labs/msw-lens/schema/manifest.schema.json
```

---

## How Developers Get It

**Option A — modeline in the YAML file (recommended for users):**
```yaml
# yaml-language-server: $schema=https://unpkg.com/@hypertheory-labs/msw-lens/schema/manifest.schema.json
endpoint: /api/cart
```
No VS Code configuration required. Schema travels with the file.
When `lens:context` scaffolds a new manifest, it should include this line automatically.

**Option B — `.vscode/settings.json` glob (recommended for the monorepo itself):**
```json
{
  "yaml.schemas": {
    "./lens/schema/manifest.schema.json": "**/__mocks__/**/*.yaml"
  }
}
```
Covers all manifests in the project without touching individual files.

---

## Design Principles

**Permissive, not prescriptive.** Every object in the schema uses `"additionalProperties": true`.
Unknown fields are not errors — they're developer annotations, future fields, or notes to
the LLM. The schema is Cyrano: it whispers suggestions, it doesn't gatekeep.

**`required` is minimal.** Only `endpoint`, `method`, and `scenarios` are required. Everything
else surfaces through autocomplete — the developer discovers it when they need it.

**`markdownDescription` over `description`.** VS Code renders markdown in hover tooltips.
Every field has examples, common values, and a plain-English explanation. The schema is the
documentation at the point of need — not a separate docs page the developer has to find.

**Scenario names are open.** The `scenarios` object uses `additionalProperties` with the
scenario schema — any key is valid. The archetypes (`happy-path`, `typical`, `validation-error`
etc.) live in the `markdownDescription` of the `scenarios` field as suggestions, not as an
enum. A developer can name a scenario `tuesday-afternoon-edge-case` and the schema is fine
with that.

---

## Fields Defined

### Top-level (required)
- `endpoint` — URL or path pattern, including `:param` syntax
- `method` — HTTP method enum: GET POST PUT PATCH DELETE HEAD OPTIONS
- `scenarios` — map of scenario name → scenario object

### Top-level (optional)
- `shape` — `document` | `collection`. Informs scenario archetype suggestions in the prompt.
- `description` — what this endpoint returns; used in `context.md` and the prompt

### `responseType` (optional)
- `name` — TypeScript type name
- `path` — path to the type file, relative to project root
- `openApiSpec` — path or URL to an OpenAPI spec *(not yet implemented in lens:context)*
- `openApiRef` — JSON pointer into the spec, e.g. `#/components/schemas/CartItem`

### `errorType` (optional)
- `name` — TypeScript type name for error responses (commonly `ProblemDetails`)
- `path` — path to the type file

### `context` (optional)
- `sourceHints` — array of file paths; `lens:context` inlines these into the prompt
- `hints` — array of free-form strings; annotations for the LLM about things the code
  doesn't make obvious (auth behavior, optimistic update strategy, business rules)

### Scenario object
- `description` — what UI behavior this tests (not what the data looks like)
- `active` — boolean; marks the default scenario
- `httpStatus` — integer 100–599; omit for 200
- `delay` — `"real"` | `"infinite"` | millisecond string

---

## What to Revisit

- **`delay` type**: currently a string to match MSW's delay API. If MSW adds new delay
  modes, update the `markdownDescription`. Consider whether to add an integer type for
  fixed-ms delays (currently documented as a string like `"2000"` but could be numeric).

- **`openApiSpec` + `openApiRef`**: fields are in the schema, not yet implemented in
  `lens:context`. When implementation starts, design note 13 has the intent.

- **`hints` vs `sourceHints`**: `sourceHints` are file paths the tool acts on (crawls and
  inlines). `hints` are freeform strings passed to the LLM as-is. Keep them separate.
  If the distinction gets confusing, reconsider the naming.

- **Per-scenario `responseType` override**: some scenarios return a fundamentally different
  shape (e.g. a `validation-error` scenario on a POST returns `ProblemDetails`, not the
  success type). Whether to support per-scenario type overrides is an open question.

- **SchemaStore submission**: once the package is stable, submit the schema to
  [SchemaStore](https://www.schemastore.org/json/) so the YAML extension picks it up
  automatically for files named `*.msw.yaml` or co-located with `__mocks__`. Requires
  agreeing on a filename convention.

---

## Package Distribution

Add `schema/` to the `files` array in `lens/package.json` so it's included in the
published package:

```json
{
  "files": ["dist", "schema"]
}
```

The unpkg CDN serves it automatically once the package is on npm.
