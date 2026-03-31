import { Component, VERSION, signal } from '@angular/core';
import { BasicCard } from '@ht/shared/ui-common/cards/basic-card';
import { PageLayout } from '@ht/shared/ui-common/layouts/page';

@Component({
  selector: 'ht-home-home',
  imports: [PageLayout, BasicCard],
  template: `
    <app-ui-page title="This Starter">
      <app-ui-card-basic title="Includes" class="mt-4">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          @for (feature of features(); track feature.title) {
            <div
              class="card-border bg-base-200 shadow-lg shadow-base-300 text-secondary-content h-full  flex flex-col content-start justify-items-start hover:bg-base-300 hover:scale-105 transition"
            >
              <div class="p-4">
                <h2 class="font-bold text-secondary mb-2">{{ feature.title }}</h2>
                <p class="text-base-content">{{ feature.description }}</p>
                <a href="{{ feature.link }}" target="_blank" class="text-primary mt-2 inline-block"
                  >Learn More at {{ feature.link }}</a
                >
              </div>
            </div>
          }
        </div>
      </app-ui-card-basic>
    </app-ui-page>
  `,
  styles: ``,
})
export class ToolsPage {
  version = VERSION.full;
  features = signal([
    {
      title: 'Tailwind CSS',
      description: 'A utility-first CSS framework for rapid UI development.',
      link: 'https://tailwindcss.com/',
    },
    {
      title: 'DaisyUI',
      description: 'A Tailwind CSS component library that provides pre-designed UI components.',
      link: 'https://daisyui.com/',
    },
    {
      title: 'Mock Service Worker (MSW)',
      description: 'A tool for mocking API requests in development and testing.',
      link: 'https://mswjs.io/',
    },
    {
      title: 'Vitest',
      description:
        'A Vite-native unit testing framework that provides fast and efficient testing capabilities.',
      link: 'https://vitest.dev/',
    },
    {
      title: 'Playwright',
      description:
        'A Node.js library for browser automation that allows you to write end-to-end tests for web applications.',
      link: 'https://playwright.dev/',
    },
    {
      title: 'ESLint',
      description:
        'A static code analysis tool for identifying and fixing problems in JavaScript and TypeScript code.',
      link: 'https://eslint.org/',
    },
    {
      title: 'Angular ESLint',
      description:
        'An ESLint plugin that provides linting rules and configurations specifically for Angular projects.',
      link: 'https://github.com/angular-eslint/angular-eslint',
    },
    {
      title: 'Prettier',
      description:
        'An opinionated code formatter that enforces a consistent style by parsing your code and re-printing it with its own rules.',
      link: 'https://prettier.io/',
    },
    {
      title: 'Softarc Sheriff',
      description:
        'A tool for monitoring and enforcing code quality and security standards in your projects.',
      link: 'https://sheriff.softarc.io/',
    },
    {
      title: 'Softarc Detective',
      description: `Visualize and Analyze your TypeScript-based Architecture!

Detective leverages forensic code analysis at the architectural level to uncover hidden patterns in your codebase.`,
      link: 'https://github.com/angular-architects/detective#readme',
    },
    {
      title: 'Hey! OpenApi Generator',
      description:
        'A tool for generating API client libraries, server stubs, and API documentation from OpenAPI specifications.',
      link: 'https://heyapi.dev/',
    },
  ]);
}
