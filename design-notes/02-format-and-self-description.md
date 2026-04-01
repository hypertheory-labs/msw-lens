# Format and Self-Description

## Format Decision: YAML (Jeff's call)
Use YAML for the scenario manifests. Reasons:
- Supports inline comments — developers annotating intent directly in the file is high-value
- More human-readable for direct editing (power users will edit these directly)
- LLMs handle YAML fine
- VS Code autocomplete via YAML schema still possible

Caveat resolved: Teams chat destroys YAML formatting, which matters in a course context. Already solved — a VS Code extension (built separately) handles pulling files over for students without copy-paste.

## Self-Description on First Run (Jeff's idea)
On first run, msw-lens generates a self-description file — something like `msw-lens-context.md` or `msw-lens.llms.txt` — that explains:
- What msw-lens is and how it works
- The manifest format and what each field means
- The scenario archetype vocabulary (what "empty", "slow", "overloaded" etc. mean semantically)
- The HMR mechanism
- Optionally: the current state of this project's manifests (what's mocked, what scenarios exist)

This file is designed to be dropped into *any* LLM conversation as instant context. Developer says "hey Gemini, look at this file" and Gemini immediately understands the system without needing a tour.

Parallel to Stellar's `describe()` API and `llms-full.txt` pattern. The principle: treat LLM accessibility as a first-class output, not an afterthought.

### Dynamic vs Static Self-Description
The self-description could be partly *generated* from the current manifest state — not just "here's how the tool works" but "here's what this project has mocked, here's what scenarios exist, here's what's currently active." That makes it a live snapshot, not just documentation.

## Schema Approach
JSON Schema (adapted for YAML) with `description` fields on every property. The descriptions carry semantic meaning, not just type constraints. Controlled vocabulary for scenario archetypes with definitions baked into the schema descriptions.

Companion `llms.txt` explains the system at a higher level than the schema can.
