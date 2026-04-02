# Playwright Test Generation — msw-lens + Stellar

## The Gap

Neither msw-lens nor Stellar generates Playwright tests today. Both have the data to make
that possible. The opportunity is in combining them.

---

## What Each Tool Contributes

**msw-lens provides the conditions:**
- Which scenario was active (the mock state the app was running under)
- What the server returned for each endpoint (status, shape, delay)
- Scenario descriptions written as UI behavior assertions:
  > "tests whether the optimistic update is rolled back or left as stale UI"

**Stellar provides the evidence:**
- The full causal chain: user click → HTTP request → HTTP response → state delta
- Before/after state snapshots tied to specific interactions
- The recording as a directed graph, exportable as markdown via "Copy for AI"
- Already has a Playwright fixture bridge: `page.evaluate(() => window.__stellarDevtools.snapshot())`

Together they answer the three questions a Playwright test needs:
1. **Setup** — what mock condition was the app under? (msw-lens manifest)
2. **Action** — what did the user do? (Stellar click recording)
3. **Assertion** — what should have changed, and did it? (Stellar state delta + scenario description)

---

## Proposed Workflow (not built yet)

1. Developer sets a specific scenario in msw-lens (e.g. `PATCH cart/:id → server-error`)
2. Developer performs the interaction in the browser (clicks `+` on a cart item)
3. Stellar records the full trace: click → PATCH → 500 → state snapshot (no rollback)
4. Developer exports: Stellar "Copy for AI" recording + msw-lens manifest YAML
5. Drops both into an LLM conversation
6. LLM generates a Playwright test that:
   - Calls `writeActiveScenarios` (or a test helper wrapping it) to set the scenario
   - Performs the recorded interaction
   - Asserts the expected UI behavior — or flags that the component doesn't handle it

Step 6 is where it gets interesting. The scenario description says "tests whether the
optimistic update is rolled back." The Stellar recording shows it was *not* rolled back
(state still reflects the increment after the 500). The LLM generates a test that asserts
rollback — and the test *fails*. That's not a bug in the test. That's a found gap, the same
way the cold-instance peer review found the silent error swallowing in `_load()`.

---

## The Bridge Point

msw-lens already has `writeActiveScenarios(cwd, state)` — a pure function that writes the
scenario file. A Playwright global setup or fixture could call it directly before each test:

```ts
// playwright/fixtures/msw-lens.ts
import { writeActiveScenarios } from 'msw-lens'; // once it's a package

export function setScenarios(scenarios: Record<string, string>) {
  writeActiveScenarios(process.cwd(), scenarios);
  // Vite HMR picks it up — or wait for file change + page reload in test
}
```

Stellar's side of the bridge already exists: `page.evaluate(() => window.__stellarDevtools.snapshot())`.

The two together in a fixture: set scenario → perform action → snapshot → assert.

---

## Relationship to Stellar's MSW Integration

Stellar has its own MSW integration ("deterministic chaos modes": race, errors). That's
complementary, not overlapping — Stellar's chaos modes are ad-hoc and test-time; msw-lens
scenarios are named, persistent, and checked into the repo. They could coexist:
- msw-lens for named, developer-controlled scenarios (the "eye doctor" experience)
- Stellar chaos modes for randomized stress testing during CI

---

## What Needs Designing

- How does a Playwright test wait for HMR after `writeActiveScenarios`? (or does it reload?)
- Should `lens:context` explicitly prompt for Playwright test generation? (i.e. include a
  "write Playwright tests for these scenarios" instruction in `prompt.md`)
- Is the Stellar "Copy for AI" format stable enough to include in a combined prompt?
- Should there be a combined `lens:test` command that generates both the scenario setup
  code and a test scaffold?

---

## Why This Matters

The cold-instance peer review proved the thesis: give an LLM the right structured context
and it finds things a summary would miss. Playwright test generation is that thesis applied
to testing. The manifest descriptions are already written as behavior assertions. The Stellar
recording provides the observable evidence. An LLM reading both doesn't just generate
boilerplate — it generates tests that know what they're testing and why.

This is the feedback loop made complete: msw-lens sets the condition, the developer acts,
Stellar records the result, an LLM writes the test. No manual test authoring. No vacuous
assertions. Gaps surface automatically.
