---
title: The context generator
description: Use `lens:context` to produce an LLM-ready prompt from a component's actual source. The feature that matters most.
---

```bash
npm run lens:context -- src/features/cart/Cart.tsx
```

This is the feature msw-lens exists for.

Point it at a component (`.ts`, `.tsx`, `.js`, `.jsx`). It crawls the component's imports, collects the real source files it depends on, includes any existing manifests as pattern reference, and writes `.msw-lens/prompts/<component>.md` — a complete prompt you can paste into any AI conversation.

## What the prompt contains

Every generated prompt has four sections in a fixed order:

1. **The ask.** A pre-written request asking the AI to identify endpoints, generate manifests, generate handler stubs, and flag scenarios you didn't ask about. The phrasing is deliberate — it asks for UI-behavior descriptions rather than data-shape descriptions, and demands explicit assumptions rather than silent gap-filling.

2. **Source files.** The actual contents of every TypeScript/JSX file reachable from the entry component's imports (and their imports, recursively). For Angular, any sibling `.html` template file if `templateExtension` is configured.

3. **Handler registration.** Your `handlers.ts` aggregator, so the AI knows the pattern for registering new handlers.

4. **Existing manifests + handlers.** All the manifests msw-lens found in your project, plus their sibling `.ts` handler files. These act as pattern reference — the AI copies your conventions rather than inventing new ones.

5. **About msw-lens.** A short blurb explaining what the tool is and what scenario archetypes are conventional.

The output is typically 15–40 KB. Paste the whole thing.

## Why this works better than a persona prompt

You could write a system prompt that says "you are an expert in MSW mock generation." That prompt has no idea whether your component handles `null` vs empty array, whether your auth store has a race condition, or whether your form has a pending state. It's generic advice dressed up as expertise.

An AI reading **your actual code** finds things you didn't ask about:

- "Your `useCart` hook doesn't handle the case where `r.ok` is false but the body is JSON — you might want a `malformed-data` scenario."
- "Your component imports `AuthGuard` but I don't see the guard source — I'm assuming 401 responses trigger a redirect; let me know if that's wrong."
- "The Checkout button has no `pending` class handling — a `slow` scenario will expose that gap."

These are observations from the real code. They're worth more than any persona prompt because they're *specific to what you actually shipped*.

## What to expect back

A good AI response includes:

- A manifest YAML for each endpoint the component touches
- A handler `.ts` stub per endpoint, switching on scenario name
- An updated `handlers.ts` showing how to register the new handlers
- A "gaps" section noting things the AI saw in your source that suggested scenarios you didn't ask about, or questions it couldn't answer from the files provided

If the AI silently hallucinates a shape for a type that wasn't provided, the prompt asks it explicitly to list assumptions instead. It'll usually honor that.

## Iterating on the output

The first generation is the bootstrap. After that:

- Paste the generated manifest into your project (tweak scenario names if the AI drifted from your vocabulary)
- Paste the generated handler into your project
- Update `handlers.ts` to register it
- Run `npm run lens` to start switching

If the AI missed a scenario you wanted, add it to the YAML yourself and update the handler's switch statement. The structure makes it easy to slot in new cases.

If the AI got a response shape wrong because it didn't have your types file, the next iteration will include it automatically — once a manifest exists with `responseType.path`, future `lens:context` runs inline that file too.

## Multi-endpoint components

If your component touches three endpoints, you'll get three manifests and three handlers in one prompt. Ask the AI to list them separately; that's the one post-generation fixup usually needed.

(An open design question: should `lens:context` produce one prompt per endpoint instead? Currently it produces one prompt for the whole component. Feedback welcome.)
