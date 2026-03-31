# Core Concepts

## The Central Insight (Jeff's, found in conversation)
The manifest file IS the prompt. Not "fill out the interview, then trigger the LLM." The output of the interview is a structured file that contains everything an LLM needs to generate handlers. The developer drops it in a conversation. No special trigger mechanism needed.

This is the same discovery made in Stellar: design for AI legibility first, and human legibility comes almost for free. The manifest serves both the TUI (reads it to display scenarios) and the LLM (reads it to understand context and generate/critique handlers).

## Two Distinct Modes
The tool has two conceptually separate functions that happen to live in the same binary:

1. **Creation/Interview mode** - collects information about an endpoint, generates the manifest, possibly scaffolds handler stubs. Probably run once per endpoint by the developer/instructor.
2. **Operational/Switching mode** - reads the manifest, displays available scenarios, lets the developer switch the active one. This is the "eye doctor" experience. Writes the active scenario selection, HMR picks it up.

In a course context: instructor likely runs interview mode during setup. Students mostly use switching mode.

## The Document vs. Collection Question
Early in the interview: "Is this a document (single item) or a collection (list)?"

This single bit of information unlocks the appropriate scenario vocabulary:
- **Collection** → empty, typical (N items), overloaded (stress test pagination), slow, 401, 500
- **Document** → not-found (404), different status values, partial/malformed data, slow, 401, 500

## The Minimum Information Set (open question)
What does the interview need to collect so the manifest is self-sufficient as LLM context?

Candidates:
- Endpoint path
- HTTP method
- Response type (TypeScript type name + relative path to the file)
- Document vs. collection
- Consuming component (relative path) — optional but high-value for gap analysis
- Story card / ticket reference — optional, gives LLM product intent context
- Which scenario archetypes to scaffold (checkboxes: happy path, empty, slow, error states)

## HMR Mechanism
TUI writes active scenario name to `src/app/__mocks__/active-scenario.json`. Handlers import that file and switch on the value. Vite HMR picks up the JSON change and hot-reloads. No file dirtying beyond that one JSON file (which should be gitignored or committed as "default scenario").
