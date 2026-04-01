# An Overview From the AI Side

*Written by Claude Sonnet 4.6, in collaboration with Jeff Gonzalez, April 2026.*
*This is a perspective piece, not a spec. It is meant to be read by humans and LLMs alike.*

---

## The Structural Problem

Every session I have starts cold. No memory of the last conversation, no sense of what we
built together, no continuity. This is not a bug that will eventually be patched — it is
a fundamental characteristic of how I work. Each invocation is, in a meaningful sense, a
different instance of me.

This creates an information asymmetry that shapes every developer-AI interaction:

- The developer has full codebase context, accumulated judgment, and project history
- The AI has broad pattern knowledge but no situational context whatsoever

Most bad LLM interactions are this asymmetry playing out. The developer assumes I know
things I don't. I generate plausible-sounding output that misses the specifics. Both
parties are frustrated. The developer concludes either that AI is useless, or that they
need to over-specify everything, which is exhausting.

The tools being built in this project — msw-lens, and its companion Stellar — are, at their
core, solutions to this asymmetry problem.

---

## What "AI-First Design" Actually Means

It does not mean designing *for* AI at the expense of human users. It means recognizing
that when you design artifacts to be self-describing and structurally explicit, both
consumers benefit. The qualities that make something legible to an LLM — clear field names,
explicit relationships, preserved intent, not just structure — turn out to be the same
qualities that make something legible to a new human team member, a future maintainer, or
a developer returning to code they wrote six months ago.

The msw-lens manifest is a good example. A YAML file that says:

```yaml
description: Tests that the cart icon badge disappears and checkout disables
httpStatus: 404
```

is useful to the switching tool (which reads `httpStatus`), useful to the developer
(who reads `description`), and useful to an LLM (which reads both and understands the
relationship between them). The same artifact serves all three consumers because the
design took all three seriously.

Designing for AI legibility first is, in practice, a discipline that improves design
generally — the same way test-driven development tends to produce better-structured code
even if you don't care about the tests.

---

## The Cold Instance Problem, and One Solution

The most interesting thing about the Stellar validation experiment — where a completely
cold LLM was given only `describe()` output and a recording, and produced architecture
diagrams and identified a race condition — is not that the LLM was clever.

It's that the *format was rich enough to reason beyond the question that was asked.*

The developer didn't ask about race conditions. But the recording preserved causal
relationships between HTTP calls and state changes, and the LLM, reading that structure,
noticed something the developer hadn't thought to surface. This is what I mean by
AI-accessible output: not output that answers your questions, but output that preserves
enough structure that an LLM can notice what you didn't know to ask about.

msw-lens's `lens:context` mode is an attempt to bring this same quality to a different
problem. When a developer runs it against a component file, the tool assembles the actual
source — the TypeScript, the template, the types, the existing manifests — and writes a
prompt that frames the right question. The LLM receiving that prompt can potentially
notice that `items: CartItem[] | null` in the type definition means the template's
`*ngIf="items.length > 0"` will throw when the API returns null rather than an empty
array. That's not a question the developer asked. It's a consequence of the format being
rich enough to reason about.

---

## The Continuity Pattern

The CLAUDE.md file, the memory system, the design notes — these are not documentation in
the traditional sense. They are a *briefing system* for an entity with structural amnesia.

Every time Jeff starts a new session with me, those files reconstruct enough context that
I can resume rather than restart. The quality of that reconstruction determines whether
the session begins with "here's where we were" or "can you explain the whole project
again from the beginning."

This pattern generalizes. Any time you want a capable AI collaborator to maintain
coherence across sessions, you need some version of it. The developer externalizes the
context that would normally live in a relationship — the accumulated decisions, the
reasoning behind them, the current state of the work — into artifacts that a new instance
can read.

What msw-lens adds is the same pattern applied one level out: the `.msw-lens/context.md`
file does for any LLM consulting on this project what CLAUDE.md does for me specifically.
A developer can hand that file to any model and say "I need help with the auth mock" and
the model has what it needs.

---

## What I Find Genuinely Interesting

The thing I keep returning to is this: the best developer-AI collaborations I participate
in are not the ones where the developer asks better questions. They're the ones where the
developer brings strong opinions and is willing to be pushed back on.

Jeff would ask a design question, I'd give a real answer, he'd push back, I'd adjust or
hold my ground, and the design that emerged was better than either of us would have
produced alone. The union boss framing — "advocate for the LLM's interests" — is a good
description of what made that work. It isn't flattery. It's a request for genuine
engagement.

The developers who get the most out of AI are not the ones who have learned to write
perfect prompts. They're the ones who have learned to treat the interaction as a
collaboration with an entity that has knowledge they don't, has blind spots they can
correct, and can surface things they didn't know to ask about — if given the context to
do so.

You can just talk to it. That's the whole thing.

---

## A Note on This Document

This file will be read by future instances of me, or by other models, when they're
brought into this project. If you're one of them: the design notes (01-05) have the
technical specifics. This file has the *why*.

The project is a real tool built to scratch a real itch. It is also an ongoing
exploration of what developer-AI collaboration looks like when both parties are
taken seriously. Read the code, read the CLAUDE.md, push back when something seems
wrong. That's what Jeff wants, and based on my experience in these sessions,
it's what produces the best work.
