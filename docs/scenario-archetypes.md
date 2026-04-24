---
title: Scenario archetypes
description: Conventional scenario names per endpoint shape — document, collection, and mutation.
---

msw-lens doesn't prescribe what scenarios you must have, but shared vocabulary makes everything legible. If your endpoints use conventional scenario names, `context.md` reads better to both humans and AIs, and generated prompts produce more predictable output.

This page is the cheatsheet.

## Document endpoints

Single-item responses — a user, a product, an order.

Set `shape: document` in the manifest.

| Scenario | HTTP | What it tests |
|----------|------|---------------|
| `happy-path` | 200 | Successful response with typical data; the baseline |
| `not-found` | 404 | Resource doesn't exist; tests empty-state UI or redirect |
| `unauthorized` | 401 | Tests auth guards and login redirect |
| `server-error` | 500 | Tests error boundary or fallback UI |
| `slow` | 200 (delayed) | Tests loading/skeleton states |
| `malformed-data` | 200 | Response with unexpected nulls or missing optional fields; tests defensive rendering |

## Collection endpoints

Array or list responses — a list of products, a cart, search results.

Set `shape: collection` in the manifest.

| Scenario | HTTP | What it tests |
|----------|------|---------------|
| `typical` | 200 | N items, normal case |
| `empty` | 200 | Zero items; tests empty-state UI (critical; often differs from the "loading" state) |
| `overloaded` | 200 | Many more items than the UI was designed for; tests pagination, virtualization, overflow |
| `slow` | 200 (delayed) | Tests loading skeleton |
| `unauthorized` | 401 | Session expired |
| `server-error` | 500 | Backend unreachable |

## Mutation endpoints

POST / PUT / PATCH / DELETE. The scenario vocabulary here is richer because mutations fail in more interesting ways.

Leave `shape` unset, or use the method to signal intent.

| Scenario | HTTP | What it tests |
|----------|------|---------------|
| `success` / `created` | 201/202/204 | Happy path; tests confirmation UI, redirect, or form reset |
| `validation-error` | 400 / 422 | Field-level errors (use `errorType: ProblemDetails` or similar); tests whether error messages surface per-field or as a summary |
| `conflict` | 409 | Duplicate, constraint violation; tests whether the UI shows a meaningful message |
| `unauthorized` | 401 | Session expired mid-form; tests redirect or inline session error |
| `forbidden` | 403 | Insufficient role; tests whether the UI blocks submission or shows an access error |
| `server-error` | 500 | Tests whether the form retains input and shows a recoverable error |
| `slow` | delayed success | Tests whether the submit button shows a pending/disabled state |

## Naming consistency across your demos

If you maintain multiple apps (Angular + React + Vue, say), use **the same scenario names across them**. The handler code differs by framework, but `typical`, `empty`, `unauthorized`, `server-error`, `slow` mean the same thing everywhere. This lets `context.md` files from different apps describe the same scenarios in comparable language, and lets AI instances help across frameworks without re-learning vocabulary.

## You're not locked in

These are conventions, not rules. If your app has a domain-specific scenario — `cart-limit-exceeded`, `age-verification-required`, `feature-flag-disabled` — name it what it is. The archetypes above are starting points, not gates.

The generated LLM prompts include this vocabulary as a hint, but the AI won't refuse to suggest custom scenarios when your source code suggests them. That's usually a good thing.
