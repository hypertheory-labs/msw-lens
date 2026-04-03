# test/ — Cold Instance Experiment Output

This directory contains the output of a cold Claude instance that was given
`.msw-lens/prompts/add-product.md` and nothing else. No prior context, no
project memory, no access to `lens/` or `design-notes/`.

It is a reference artifact — kept here so the experiment can be repeated with
other models and compared against this baseline.

See `design-notes/11-cold-instance-experiment.md` for full analysis of what
the cold instance got right, what it missed, and why.

---

## Jeff — here's what to do when you want to show someone this

**What you're demonstrating:** You give an AI nothing but a generated prompt
file and it produces working MSW handlers, correct scenario coverage, and
flags real bugs in your code — cold, no coaching, no prior context.

**Step 1 — Show the form.**
Open `src/app/areas/shopping-cart/shopping-cart-landing/internal/pages/add-product.ts`
in the editor. Point out: it's a real Angular component with a real store. No
comments explaining the API. No mock setup yet.

**Step 2 — Run lens:context.**
```bash
npm run lens:context -- src/app/areas/shopping-cart/shopping-cart-landing/internal/pages/add-product.ts
```
Show them `.msw-lens/prompts/add-product.md`. This is the entire context the
AI will get. Scroll through it — source files inlined, existing handlers as
pattern reference, a structured ask.

**Step 3 — Open a fresh Claude session in a different directory.**
This is important. Different directory = no project memory = genuinely cold.
A clean clone of the repo works perfectly.

**Step 4 — Paste the prompt. Don't add anything.**
Just the contents of `add-product.md`. Watch what comes back.

**Step 5 — Compare against `test/`.**
The files in this directory are what a cold instance produced. Point out:
- It identified both endpoints (GET + POST) from store source alone
- Scenario descriptions describe UI behavior, not data shapes
- It caught the missing error handling in the store — embedded in scenario descriptions
- It caught the double-submit window on the slow scenario
- It caught the number field reset edge case (`reset-to-zero`)
- It used `crypto.randomUUID()` and 422 instead of 400 without being told

**The punchline:** The AI didn't need you to tell it any of that. It read your
code and found it. The prompt is just the delivery mechanism — `lens:context`
assembled the right files; the AI did the rest.

---

## What this directory contains

| File | What it is |
|------|------------|
| `products/products.yaml` | GET manifest — 6 scenarios |
| `products/products.ts` | GET handler |
| `products/products-post.yaml` | POST manifest — 7 scenarios including `reset-to-zero` |
| `products/products-post.ts` | POST handler |
| `handlers.ts` | Updated handler registration |

The rest (`auth/`, `cart/`, `active-scenarios.ts`, `browser.ts`) are copies of
the existing handlers included by the cold instance's full `__mocks__` output.
The only new files are in `products/`.
