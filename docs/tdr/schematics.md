# Feature Scaffolding with Angular Schematics

## Why Schematics?

Adding a new feature area to this application involves creating several files and wiring them into the rest of the app. Done manually, this means:

- Creating the `{name}-landing/` directory with a routes file and two components
- Adding a lazy-loaded route to `app.routes.ts`
- Adding a nav link entry to the `links` signal in `app.ts`

These steps are mechanical and error-prone. A custom Angular schematic automates all of them as a single `ng generate` command, and because it runs inside the Angular DevKit, it modifies existing files atomically — if anything fails, no partial changes are written.

## Generating a New Feature Area

```bash
ng generate feature-landing <name> [--title="Display Name"] [--icon=lucideIconName] [--path=url-path]
```

### Options

| Option | Required | Default | Description |
|---|---|---|---|
| `name` | yes | — | kebab-case identifier, e.g. `orders`, `product-catalog` |
| `--title` | no | Title-cased name | Text shown in the nav sidebar |
| `--icon` | no | `lucideCircle` | Any [Lucide icon](https://lucide.dev/icons/) name |
| `--path` | no | same as `name` | URL segment, if different from `name` |

### Example

```bash
ng generate feature-landing orders --title="Orders" --icon=lucidePackage
```

This produces:

```
CREATE src/app/areas/orders/orders-landing/orders.routes.ts
CREATE src/app/areas/orders/orders-landing/internal/home.ts
CREATE src/app/areas/orders/orders-landing/internal/pages/home.ts
UPDATE src/app/app.routes.ts
UPDATE src/app/app.ts
```

The lazy route is inserted into `realRoutes` in `app.routes.ts`:

```typescript
{
  path: 'orders',
  loadChildren: () =>
    import('./areas/orders/orders-landing/orders.routes').then((r) => r.ordersFeatureRoutes),
},
```

The nav link is inserted into the `links` signal in `app.ts`:

```typescript
{ path: '/orders', title: 'Orders', icon: 'lucidePackage' }
```

You can preview what will be generated without writing any files using `--dry-run`:

```bash
ng generate feature-landing orders --title="Orders" --icon=lucidePackage --dry-run
```

## What Gets Generated

Each new feature follows the standard area structure (see [project-structure.md](project-structure.md)):

```
src/app/areas/{name}/
└── {name}-landing/
    ├── {name}.routes.ts          # Lazy route entry point, exports {name}FeatureRoutes
    └── internal/
        ├── home.ts               # Section layout shell — holds sub-nav and router outlet
        └── pages/
            └── home.ts           # Default page component
```

The generated files use `ChangeDetectionStrategy.OnPush` and inline templates/styles, matching the conventions in `angular.json`.

## Where the Schematic Lives

The schematic source is in [schematics/](../../schematics/) at the project root:

```
schematics/
├── collection.json               # Declares available schematics
├── package.json                  # Makes the dist/ output resolvable by Angular CLI
├── tsconfig.json                 # Compiles TS → dist/schematics/
└── src/
    └── feature-landing/
        ├── index.ts              # Rule logic (file generation + file modification)
        ├── schema.json           # Input schema / CLI options
        └── files/                # EJS template files
```

The compiled output lives in `dist/schematics/` (git-ignored) and is registered in `angular.json`:

```json
"cli": {
  "schematicCollections": ["angular-eslint", "./dist/schematics"]
}
```

## After Changing the Schematic

If you modify any file under `schematics/`, rebuild before running `ng generate`:

```bash
npm run build:schematics
```

## Adding Pages to an Existing Feature

The schematic only scaffolds the initial landing structure. Adding new pages within an existing feature is still a manual step — create a component under `internal/pages/` and add it to the feature's routes file and the `links` signal of the feature's `home.ts`.
