# Enforcing Module Boundaries

Module boundaries in this project are enforced by [Sheriff](https://sheriff.softarc.io/) via ESLint. The rules are defined in `sheriff.config.ts` at the project root. Violations show up as lint errors in the editor and in CI.

The boundaries work across two independent dimensions: **area** (horizontal isolation between features) and **type** (vertical hierarchy within an area).

## Areas

Every folder under `src/app/areas/<domain>/` belongs to an area tagged `area:<domain>`. Areas are isolated from each other — code in `area:home` cannot import from `area:profile`, and vice versa.

The `shared` area is the one exception. Any area can import from `area:shared`. This is what makes `src/app/areas/shared/` the right place for code that genuinely needs to be used across multiple areas.

The `app` root (`src/app/` itself, including `app.ts`, `app.routes.ts`, and `app.config.ts`) is tagged `root` via autotagging. Root can import from anywhere. Its job is to wire areas together, not to contain logic.

## Types

Within an area, folders are tagged by type and form a strict hierarchy. Higher-level types may depend on lower-level ones, but not the reverse.

| Type      | Can import from           |
| --------- | ------------------------- |
| `feature` | `ui`, `data`, `util`      |
| `ui`      | `data`, `util`            |
| `data`    | `util`                    |
| `util`    | nothing (outside itself)  |

These rules apply within the same area. Cross-area imports are blocked regardless of type (except from `area:shared`).

## Module Tags (from `sheriff.config.ts`)

| Folder pattern                               | Tags assigned                   |
| -------------------------------------------- | ------------------------------- |
| `src/app/areas/<domain>/feature-<name>`      | `area:<domain>`, `type:feature` |
| `src/app/areas/<domain>/ui-<name>`           | `area:<domain>`, `type:ui`      |
| `src/app/areas/<domain>/data`                | `area:<domain>`, `type:data`    |
| `src/app/areas/<domain>/util-<name>`         | `area:<domain>`, `type:util`    |
| Everything else reachable from `src/main.ts` | `root`                          |

## The `internal` Folder

Any subfolder named `internal` is treated as private to its module. Even if another module would otherwise have permission to import from a given module, it cannot reach into that module's `internal` folder. This is how Sheriff provides encapsulation within a module — use `internal` for implementation details you don't intend to expose.

## Summary of `depRules`

```ts
depRules: {
  root: '*',
  'area:*': [sameTag, 'area:shared'],
  'type:feature': ['type:ui', 'type:data', 'type:util'],
  'type:ui': ['type:data', 'type:util'],
  'type:data': ['type:util'],
  'type:util': [],
}
```

Both the area rule and the type rule must be satisfied for an import to be allowed. For example, `area:home` / `type:feature` can import from `area:home` / `type:ui` (same area, lower type), and also from `area:shared` / `type:ui` (shared area, lower type) — but not from `area:profile` / `type:ui`.
