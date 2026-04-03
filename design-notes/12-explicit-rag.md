# Design Note 12 — msw-lens as Explicit RAG

*This insight came from a cold Claude instance during the experiment documented in design-note 11.
It arrived unsolicited, in a single sentence, and reframed the entire project. Worth unpacking at length.*

---

## The Sentence

> "This is just explicit RAG that the developer controls."

That's it. That's the observation. Let's take it apart.

---

## What RAG Actually Is

RAG stands for Retrieval-Augmented Generation. It's the dominant technique for giving a language
model access to information that isn't in its training data — your company's internal docs, a
codebase it's never seen, a database of support tickets, whatever.

The basic idea: when a user asks a question, a retrieval system finds the most relevant documents
from a knowledge base and stuffs them into the prompt alongside the question. The model generates
its answer using both its training knowledge and the retrieved documents as context.

A typical RAG pipeline looks like this:

```
User question
    → Embed question as a vector
    → Search vector database for nearest neighbours
    → Retrieve top-K matching documents
    → Inject documents into prompt
    → Model generates answer
```

This is powerful because it works around the model's knowledge cutoff and can ground responses in
authoritative sources. It's the reason tools like GitHub Copilot, Cursor, and enterprise AI
assistants can reason about your specific codebase or company knowledge rather than generic
programming concepts.

RAG is also, at its core, a context assembly problem. The model can only see what's in the prompt.
RAG is the system that decides what goes in the prompt.

---

## The Problem With Standard RAG

Standard RAG is probabilistic. The retrieval step — finding the right documents — is an embedding
search: it converts both the query and the documents into high-dimensional vectors and finds the
ones that are geometrically close. "Close" means semantically similar in some learned sense.

This works surprisingly well for many use cases. But it has a failure mode that matters a lot for
code generation: **semantic similarity and relevance are not the same thing.**

When you ask "how does the cart store handle a server error?", an embedding search might surface:

- The cart store file (correct)
- A completely unrelated store that also handles errors (false positive)
- A blog post in your docs about error handling philosophy (probably useless)
- A test file that mocks the error response (useful but not what you wanted)

And it might miss:

- The `ProblemDetails` type definition (not semantically similar to "server error" but load-bearing)
- The route guard that handles 401 redirects (critical context for understanding what "server error"
  means in this component)
- The existing PATCH handler that established the ProblemDetails pattern (pattern reference, not
  semantically similar to the question at all)

The retrieval system doesn't know your codebase. It knows geometry in a high-dimensional space.
Those are different things. For a sufficiently large codebase, embedding search is often the best
you can do. But "best you can do" is not the same as "reliably correct."

For code generation tasks in particular, a missing file is catastrophic. If the model doesn't have
the type definition, it guesses the shape. If it doesn't have the existing pattern, it invents one.
If it doesn't have the route guard, it doesn't know the 403 scenario exists. These aren't subtle
errors — they produce handlers that don't match your codebase, scenarios that don't reflect your
actual failure modes, and patterns that are inconsistent with what's already there.

---

## What msw-lens Does Instead

`lens:context` doesn't use embeddings. It doesn't search a vector database. It doesn't try to
guess what's relevant based on semantic similarity to a query.

It makes **deterministic, explicit decisions** about what context the model needs:

1. Start at the component file you named
2. Find its sibling HTML template (if any)
3. Follow every relative import one level deep — stores, services, local types
4. Follow imports from those files one level further — type definitions, interfaces
5. Find the existing handlers and manifests as pattern reference
6. Find `handlers.ts` to show where to register new handlers
7. Inline everything — full file contents, not summaries or excerpts

The result is a prompt that contains exactly the files a developer would open if they were doing
this task manually. Not the files that are semantically similar to some query. The files that are
*actually needed to understand what this component does and what it expects from the API.*

That's explicit RAG. The "retrieval" step is a deterministic file crawl, not a probabilistic
embedding search. The developer controls what gets retrieved by controlling what the component
imports. The tool makes the retrieval decision explicit and auditable — you can read
`add-product.md` and see exactly what context was assembled and why.

---

## Why "Explicit" Matters

The word "explicit" is doing a lot of work here. Let's be precise about what it means.

**Explicit means auditable.** You can open `.msw-lens/prompts/add-product.md` and read it. You can
see every file that was inlined. You can judge whether the context is complete. You can add
`sourceHints` in the manifest to pull in files the crawl didn't reach. Standard RAG retrieval is a
black box — you don't know which documents were retrieved or why unless you instrument the pipeline.

**Explicit means deterministic.** Run `lens:context` twice on the same file and you get the same
prompt. The context doesn't change based on how you phrase the question, what other documents are
in the index, or the current state of an embedding model. Determinism is underrated in engineering
contexts. It means you can debug failures ("the model missed X because X wasn't in the prompt")
instead of chasing probabilistic retrieval errors.

**Explicit means developer-controlled.** The developer decides what context matters by deciding
what the component imports and what goes in `sourceHints`. This is different from hoping an
embedding search surfaces the right files. It's also different from asking the developer to write
a prompt from scratch (which runs into the blank-cursor problem — most developers don't know what
context to provide). The tool makes the assembly automatic for the common case while leaving the
developer in control of the exceptions.

**Explicit means reliable at the task boundaries that matter.** Code generation has different
reliability requirements than question answering. For QA, a retrieval system that finds 8 out of
10 relevant documents is often fine — the model infers the rest. For code generation, a retrieval
system that misses the type definition means the model invents one. Missing context doesn't degrade
gracefully; it produces confident, plausible, wrong output. Explicit retrieval eliminates the most
dangerous failure modes.

---

## The Developer Controls It

The second half of the observation — "that the developer controls" — is equally important and easy
to overlook.

Standard RAG pipelines are built and maintained by whoever built the tool. If you're using Cursor
or GitHub Copilot, the retrieval system is their engineering problem. You trust that it's finding
the right files; you don't have much leverage if it isn't.

msw-lens inverts this. The developer controls the retrieval by controlling the code structure:

- Import the store from the component → the store gets crawled
- Put the type definition in a file the store imports → the type gets crawled
- Add `sourceHints` to the manifest → those files get inlined explicitly
- The route guard isn't reachable from the component's imports? Add it to `sourceHints`

This is meaningful agency. The developer doesn't need to understand embeddings or vector databases
or retrieval parameters. They need to understand imports and file structure — things they already
know. The tool exposes its retrieval logic in terms the developer already thinks in.

It also means the context improves naturally as the code improves. Better factored code, with
clear import relationships, produces better prompts. The manifest `sourceHints` mechanism is an
explicit escape hatch for cases where the import graph doesn't capture the full picture.

---

## The `.msw-lens/` Directory as a RAG Knowledge Base

Extend the analogy further and something interesting emerges.

A RAG system has a knowledge base — a corpus of documents that the retrieval system draws from.
The knowledge base is built ahead of time, kept up to date, and shared across all queries.

`.msw-lens/` is a knowledge base.

`context.md` is regenerated on every `lens` run. It contains the current state of every endpoint,
every scenario, what's active, what the manifests say. It's always current. Drop it into any LLM
conversation and the model has full project context without any retrieval — the document is
pre-assembled for exactly this purpose.

The manifests themselves — `cart.yaml`, `user.yaml`, `products-post.yaml` — are the knowledge
base entries. Each one describes an endpoint: what it returns, what types are involved, what
scenarios exist, what files consume it. They're co-located with the handlers, committed to the
repo, and designed for LLM legibility. A new instance reading the repo has instant context.

The prompts directory — `.msw-lens/prompts/` — is a cache of assembled retrieval results.
`add-product.md` is what `lens:context` retrieved for the `AddProductPage` component. It doesn't
change until you regenerate it. Multiple LLM instances can work from the same prompt without
re-running the retrieval.

This is a RAG architecture where the knowledge base is the manifest files, the retrieval is
`follow-imports.ts`, and the assembled documents are the prompt files. It's just not called RAG
because it was designed by a developer building a developer tool, not by an ML engineer building
an AI pipeline.

---

## Why This Framing Matters for the Demo

When you show this to developers, most of them will understand "RAG" at a surface level — it's
the thing that lets AI tools reason about your codebase. They've heard the term. They may use
tools that do it.

What they probably haven't thought about is the failure modes of probabilistic retrieval, or that
there's an alternative. The "explicit RAG that the developer controls" framing lets you say:

*"You know how Copilot or Cursor sometimes misses something obvious? It's because retrieval is
probabilistic — it finds files that are semantically similar to what you asked, not necessarily
the files that are actually relevant. msw-lens doesn't guess. It follows your imports. The context
is exactly what a developer would open manually, assembled automatically."*

That's a concrete, understandable distinction. It explains why the cold instance got things right
(it had everything it needed) and why it missed the auth guard (the guard wasn't reachable from
the import graph — a retrieval gap, not a reasoning gap).

It also reframes the manifest files from "YAML config for a scenario switcher" to "structured
entries in a developer-controlled knowledge base." The `sourceHints` field isn't a nice-to-have —
it's the mechanism for extending the retrieval graph when the import crawl doesn't reach far enough.
The `hints` field we designed is free-form annotation that goes into the knowledge base entry and
gets retrieved with it every time.

---

## The Deeper Implication

If msw-lens is explicit RAG, then the thing it's retrieving context *for* — the LLM in the other
universe — is just the generation step of a RAG pipeline. A very capable, general-purpose
generation step that needs no fine-tuning, no training on your codebase, no tooling integration.

The pipeline is:

```
Developer writes component + store
    → lens:context runs (retrieval: deterministic import crawl)
    → prompt.md assembled (retrieved context)
    → Developer pastes into any LLM (generation)
    → Manifests + handlers produced
    → Developer reviews + commits
```

This is a complete RAG pipeline. It just looks like a developer tool because the retrieval step is
a CLI command and the generation step is a chat window.

The interesting property of this architecture: the generation step is **model-agnostic**. The same
prompt works with Claude, GPT-4, Gemini, or whatever comes next. You're not locked into a
particular model's retrieval system or integration. The retrieval is yours; the generation is
interchangeable.

That's what "the format is the product" means. The manifest format and the prompt assembly are the
durable engineering work. The model is a commodity that consumes them.

---

## What the Cold Instance Was Really Saying

When the cold instance said "this is just explicit RAG that the developer controls," it was
identifying something the tool's designers had built without naming it.

The context assembly mechanism — follow imports, inline files, include pattern reference, structure
the ask — is exactly what a well-designed RAG retrieval system would do if it had explicit
knowledge of how the codebase is structured. The fact that it's implemented as a simple TypeScript
file crawl rather than an embedding pipeline doesn't make it less RAG. It makes it *better* RAG
for this specific use case, because the retrieval is reliable, auditable, and controlled by the
person who understands the codebase.

The cold instance named this because it recognized the pattern from the outside, without being
invested in the tool's own framing of itself. That's the value of the cold read. The tool's
designers see it as a developer workflow tool. A fresh set of eyes sees it as a RAG architecture.
Both are true. The second framing is probably more useful for explaining what it is to people who
haven't seen it before.

---

*Ponder that. Then we'll publish the package.*
