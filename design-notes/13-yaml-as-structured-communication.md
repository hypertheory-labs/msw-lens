# Design Note 13 — YAML as Structured Human-to-AI Communication

## The Joke That's Also True

> "Ok, Claude — I know this YAML thing is kind of dumb. But we need a stricter format
> because the humans don't quite understand how to communicate with you using their words."

That's the honest version of what the manifest format is doing.

LLMs handle freeform text fine. The YAML isn't for the model — it's for the developer.
A blank prompt cursor is surprisingly hard to start from. Most people don't know what
context the model actually needs, and they don't know what questions to ask themselves.
The schema asks those questions for them: *what's the endpoint? what does it return? who
consumes it? what's not obvious from the code?*

The developer fills in the blanks and ends up with better context than they'd have written
unprompted. Not because the model required that format, but because having a form to fill
out is easier than having a blank page.

Same instinct as `data-stellar-label` in Stellar: semantic labels on icon buttons exist
not because the AI can't infer what a trash icon does, but because the developer often
hasn't consciously decided what the button means in the causal chain until they're forced
to name it. The label is for the human as much as the tool.

---

## Ctrl+. as Onboarding

One practical benefit of a real JSON Schema on these files: VS Code surfaces available
fields through autocomplete. A developer who's never read the docs can open a manifest,
hit `Ctrl+.`, and discover that `context.sourceHints` exists, or that there's an
`openApiSpec` field they haven't used yet.

That's a nicer onboarding path than documentation:
1. Create a `.yaml` file in a `__mocks__` directory
2. Schema kicks in (modeline or `.vscode/settings.json` glob)
3. Autocomplete shows what's possible
4. Developer fills in what's relevant to them, ignores the rest

The schema doubles as documentation at the point of need.

---

## OpenAPI Integration

Most of the manifests in this project were written for APIs that were designed alongside
the frontend — BFF pattern, or teaching demos where the API is whatever is convenient.
The developer already knows the shape.

But a lot of developers are working against an API they didn't design. They have an
OpenAPI spec. The TypeScript interface in `responseType.path` is either generated from it
or should be. And the spec knows things the developer might not have thought to capture:
which fields are nullable, what the 422 error body looks like, what enum values are valid.

A possible manifest extension:

```yaml
responseType:
  name: CartItem
  path: ./types/cart.ts
  openApiSpec: ../openapi.yaml   # relative path or URL
  openApiRef: '#/components/schemas/CartItem'
```

When `lens:context` sees `openApiSpec`, it pulls the relevant schema section into the
prompt. The model has the authoritative contract alongside the component source — it can
notice mismatches, flag unguarded nullable fields, and suggest scenarios implied by the
spec that weren't in the manifest.

It also works the other direction: if you're building frontend-first and don't have a spec
yet, a complete manifest is close to a requirements document. A model reading it can
suggest what the API contract should look like. The hints field is free-form for exactly
this kind of annotation.

---

## The Chain

The manifest is how humans get structured enough to hand something useful to a model.
The model's output — handlers, gap analysis, suggested scenarios — becomes the committed
artifact that the *next* model instance reads cold.

```
Developer fills in manifest (schema keeps them on track)
  → lens:context assembles prompt
  → Model generates handlers + gap analysis
  → Developer reviews, commits
  → Next model instance reads the committed artifacts
  → cycle continues
```

The schema is the entry point. Without it, the first step is a blank page and a vague
request. With it, the developer has answered the right questions before they've even
opened a chat window.
