# Validation and Design Principles

## Proof of Concept: Stellar Works
Tested in the wild: a completely cold LLM instance — no CLAUDE.md, no memories, no project context — was given only the `describe()` output and HTTP trace recordings from Stellar. It immediately understood the system. Smarter models went further and proactively identified a potential race condition in the code.

This validates the core thesis: **structured, self-describing output is sufficient context for an LLM to reason meaningfully about a running application.** No scaffolding required. No lengthy explanation. The data speaks.

This is the confidence baseline for msw-tui's self-description approach. If we design the manifest and self-description output with the same care Stellar brought to its recordings format, it will work.

## The Pre-Built Prompt Idea
"The developer drops this file into a conversation" is passive and loses context. A better first-class workflow:

The TUI has a dedicated output mode — "explain this to Claude" — that generates not just a self-description file but a *pre-built prompt*:

> "I am working on the invoice history component. I have these scenarios defined: [list]. I am currently seeing [active scenario]. Here is my manifest: [inline]. What scenarios am I missing? What edge cases should I consider?"

The gap between "file you can reference" and "prompt that actually asks the right question" is where context gets lost. We can close that gap in the tool.

## The Butlerian Jihad Principle (Jeff's framing)
The design goal is not "AI does the work." It is "AI makes the developer more capable."

Tools that outsource thinking make developers dumber over time. Tools that surface what developers missed, reveal race conditions, suggest unconsidered edge cases — those make developers smarter. The self-describing manifest approach lands on the right side of this line: the developer still owns the design, the LLM finds the gaps.

This should be a stated principle of the project: **msw-tui is designed to augment developer thinking, not replace it.**

## TUI Output: "Explain This" Mode
Beyond the operational switcher and the creation interview, a third output:
- Generates a context file + suggested prompt
- Targeted at any LLM, not just Claude
- Dynamic: reflects current manifest state, active scenario, consuming component
- Designed to be copy-pasteable into any chat interface
