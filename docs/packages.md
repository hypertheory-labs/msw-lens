# Dependencies

Overview of the libraries and packages used in this project.

## Testing

### Playwright

This project uses [Playwright](https://playwright.dev) for **System** Testing.

- `@playwright/test`

### Mock Service Workers for API Access

For developer testing (non-automated) while running the application, this app uses [Mock Service Workers](https://mswjs.io)

- `msw`

During System tests, it uses:

- `@msw/playwright`

## UI Related

During the creation of this project, I chose `Tailwind` or processing my CSS. I added some additional plugins.

- `@tailwindcss/forms`
- `@tailwindcss/typography`
- `daisyui` [See DaisyUi](https://daisyui.com)

For Icons, I use `ng-icons` with the `lucide` [Icon pack](https://lucide.dev/icons/).

- `@ng-icons/core`
- `@ng-icons/lucide`


## State

All from the fine folks at [ngrx.io](https://ngrx.io)

- `@ngrx/operators`
- `@ngrx/signals`

## Utility

### Api Generation

Generating types from [OpenApi specs](https://spec.openapis.org/) (swagger documents) with [Hey Api](https://heyapi.dev/)

> **Note**: I put a the "swagger petstore" example document in the folder if you want to try it.

- `@hey-api/openapi-ts`

There is an NPM script in the `package.json` file you can run. Put an OpenApi spec in the `/open-api-specs/specification.json`. It will generate types (including Zod schemas or those types) in the `src/areas/shared/api/` folder.

### Module Boundaries

This will be discussed more in the [Module Boundaries](dev/viewer/boundaries) section.

- `@softarc/detective`
- `@softarc/eslint-plugin-sheriff`
- `@softarc/sheriff-core`
