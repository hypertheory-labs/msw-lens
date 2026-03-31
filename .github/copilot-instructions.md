# Angular Project Guidelines

## Project Structure

This is an Angular standalone components project organized by feature areas under `src/app/areas/`.

## Code Style

- **Standalone Components**: Always use standalone components (no NgModules)
- **Signals**: Prefer Angular signals for reactive state management
- **Change Detection**: Do not add the `ChangeDetectionStrategy.OnPush' for components, as this is the default as of Angular 21.2
- **File Naming**: Use kebab-case for file names (e.g., `user-profile.ts`)
- **Component Naming**: Components should have descriptive names ending with the component type (e.g., `UserProfileComponent`)
- **No Component Suffix in Filenames**: Do not include `.component` in file names - use `user-profile.ts`, not `user-profile.component.ts`
- **No Barrel Exports**: Do not create `index.ts` files for re-exporting. Always import directly from the source file

## Component Structure

- Use functional programming patterns where appropriate
- Keep components small and focused on a single responsibility
- Extract reusable logic into services or composables
- Use dependency injection via `inject()` function (not constructor injection)

## Testing

- Write tests using Vitest (configured in this project)
- Test files should be co-located with their source files using `.spec.ts` extension
- Use Storybook for component documentation and visual testing
- Use Playwright for end-to-end tests in the `system-tests/` directory

## Architecture

- Follow the Sheriff architecture rules defined in `sheriff.config.ts`
- Organize code by feature areas, not by technical type
- Keep shared code in appropriate shared directories
- Use dependency rules to maintain clean architecture boundaries

## Styling

- Use Tailwind CSS for styling
- Prefer utility classes over custom CSS
- Keep component-specific styles minimal
- **Do not use `@apply` in component style blocks** - it does not work in this setup

## TypeScript

- Enable strict mode
- Use proper typing, avoid `any`
- Prefer interfaces over types for object shapes
- Use type inference where it improves readability

## Best Practices

- Follow the existing project structure and patterns
- Run linting (`npm run lint`) and formatting (`npm run format`) before committing
- Ensure tests pass (`npm run test`) before submitting changes
- Use meaningful commit messages
- Keep dependencies up to date
