# Design Note 11 — Cold Instance Experiment: Findings

## What We Did

Generated `.msw-lens/prompts/add-product.md` via `lens:context`, then fed it to a cold Claude instance with no prior context about the project. Evaluated the output against what we knew the endpoint required.

`.claudeignore` hid `lens/`, `design-notes/`, `.msw-lens/`, `docs/`, and `CLAUDE.md` — giving the cold instance exactly what a real developer would have: app source, existing handlers/manifests as pattern reference, and the generated prompt. Nothing more.

## What the Cold Instance Got Right

- Identified both endpoints (GET + POST) from store source alone
- Scenario descriptions described UI behavior, not data shapes — followed the instruction exactly
- Flagged the missing error handling in `_load()` and `createProduct()` — embedded in scenario descriptions, not just listed at the end
- Inferred ProblemDetails shape from existing PATCH/DELETE patterns without being told
- Generated `conflict` (409) without it being in the mutation archetypes vocabulary
- Included `cost` in test data (matched the full `ProductApiItem` type)
- Correct `shape: document` on POST (single item response)

## What It Missed

**`forbidden` (403) / admin-only endpoint** — no signal in the provided files. The route guard wasn't crawled; there were no auth hints in the store or manifest. The cold instance correctly diagnosed this: "Nothing in the provided files hinted at it." The fix it suggested: include the route config or guard in sourceHints. Our take: `auth` metadata in the manifest is the better design — makes intent explicit without requiring developers to know they should add the guard to sourceHints.

**`_load()` never called** — partially caught. The cold instance flagged the symptom ("count jumps from 0") but didn't explicitly name the root cause. Its explanation: "my mental model was 'probably called in an ngOnInit not included in the crawl.'" The `follow-imports.ts` crawl goes forward (component → its imports) but route files import components — wrong direction. Fix: auto-detect sibling `*.routes.ts` file and include it in the prompt.

## Key Insights from Post-Experiment Discussion

### "Explicit RAG that the developer controls"

The cold instance named what this tool actually is: deterministic context assembly instead of retrieval-based context. Rather than hoping an embedding search surfaces the right files, `follow-imports.ts` makes an explicit decision about what context matters. For code generation, that reliability is the whole game. This is the language for describing the tool to developers.

### Completeness closes the "should I investigate further?" loop

A complete-looking context is a "proceed" signal. The cold instance confirmed: "If the prompt had been partial, I would have gone looking." This is a dynamic worth knowing about and partially countering. Proposed fix: add to the prompt — *"If you made assumptions because certain files weren't provided, list them explicitly."* This surfaces gaps (route config, guards, parent components) in the generated output rather than requiring follow-up questions.

**Important:** keep this instruction framework-agnostic. No Angular-specific terms like "ngOnInit" or "route resolver."

### "The conversation isn't durable. The YAML is."

The cold instance articulated the central value proposition more cleanly than we had: you could tell an LLM the auth requirements in chat and it would generate the right scenario — but then that knowledge lives in one session and dies with it. The YAML makes intent permanent and model-agnostic. The next LLM, different session, different model, different developer on the team — they get the same enhanced context automatically.

This is the core of the story. Not "the tool helps LLMs" but "the tool makes developer intent durable."

### "It's not a crutch, it's a protocol"

Pushback on the "cognitive crutch" framing: an API spec isn't a crutch for building clients, it's a contract. The YAML does the same thing — makes communication reliable across parties who've never talked. The fact that a smart developer in a good conversation could skip it doesn't reduce its value; it has compounding value every time a new instance, model, or person picks it up cold.

### Auth metadata reframed

"We're not adding fields to help the LLM — the manifest should describe the endpoint accurately, and auth requirements are part of what an endpoint is." This removes the awkwardness from the `auth` field proposal. It's not a hint; it's just an accurate description of the endpoint.

## Action Items

- [ ] Add "list your assumptions" instruction to `generate-prompt.ts` (framework-agnostic phrasing)
- [ ] Auto-detect sibling route file and include in prompt crawl (`follow-imports.ts` or `generate-prompt.ts`)
- [ ] Add `auth` field to manifest format spec (design-notes/10)
- [ ] Use "explicit RAG that the developer controls" as the tool description in docs/README
