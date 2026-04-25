---
title: Introduction
description: What msw-lens is, the problem it solves, and why its output is designed for AI instances as much as for you.
---

msw-lens is a developer tool for projects that use [MSW (Mock Service Worker)](https://mswjs.io/). It does two things:

1. **Switch between mock scenarios** without editing handler files. Pick an endpoint, pick a scenario, the app updates live via Vite HMR.

2. **Generate LLM-ready context** about your mocked endpoints. Point it at a component; it crawls imports, inlines source, and writes a prompt you can drop into any AI conversation to get accurate scenario suggestions.

The switcher is real and useful. The context generator is why the tool exists.

## The problem it solves

Every time you start a new AI conversation about your app, it begins cold. No memory of what you built, what decisions you made, or what state the app is currently running under. You become the translator — explaining the architecture, pasting in files, describing the shape of your data. The longer the project, the more exhausting the translation.

msw-lens works by producing **committed artifacts** that any AI instance can read and reason about immediately:

- `src/mocks/active-scenarios.ts` — which scenario is active per endpoint
- `src/mocks/bypassed-endpoints.ts` — endpoints currently bypassing MSW (real-network passthrough)
- `.msw-lens/context.md` — a snapshot of every mocked endpoint, active scenarios, and bypass status
- `.msw-lens/prompts/<component>.md` — a ready-to-paste prompt assembled from real source files

Drop `context.md` into any conversation. That instance knows what's mocked, what scenarios exist, what's active, and where the source files are. No narration required.

## Explicit RAG, controlled by you

Most AI-assisted coding leans on implicit retrieval: the editor decides what context the model gets, or the model guesses at your architecture from snippets. The experience is good right up until the model writes something plausible-looking that doesn't fit your codebase.

msw-lens takes the opposite posture. **You** decide what context the model gets. The manifest is a YAML file you wrote (or co-authored with an AI). It lists real file paths. The prompt generator inlines the actual contents. The model reads your code — not a summary, not a persona, not a hallucinated architecture.

This is explicit RAG. The developer is the one who curates the retrieval set. The tool just makes the curation ergonomic.

## The manifest is the prompt

The single biggest design decision in msw-lens is that **the YAML manifest is self-sufficient as LLM context**. You can drop any manifest into any conversation and the model understands:

- what endpoint it describes
- what shape of response it returns
- what scenarios exist and what UI behavior each tests
- where the consuming source files live (so the model can ask to read them)

This isn't an accident. The format was designed to be legible to an AI reading it cold, as the first thing in a conversation. Human legibility came almost for free — the same structure that helps an AI reason about scenarios also helps you remember why you added them.

## The two-universe model

msw-lens creates a handoff point between separate AI sessions:

```
Universe 1 (your session)          Universe 2 (any model, any session)
─────────────────────────          ───────────────────────────────────
npm run lens:context            →  receives .msw-lens/prompts/cart.md
  crawls your actual source         reads the real TypeScript + templates
  finds the endpoints               identifies what scenarios make sense
  inlines the files                 writes the manifest YAML
  writes the prompt                 writes the handler stub
                                    flags gaps you didn't ask about
```

The prompt is the artifact. The model is interchangeable. The same prompt works with Claude, GPT-4, Gemini, or whatever comes next.

The conversation isn't durable. The YAML is.

## Who it's for

Developers who:

- Already use MSW for local development and want scenario-flipping without editing handler files
- Work with AI coding assistants and feel the cost of re-explaining their architecture each session
- Want mock definitions that survive conversation windows, team turnover, and model changes
- Like YAML more than they dislike it

The tool is framework-agnostic. Angular, React, Vue, Svelte — any MSW-using project works.
