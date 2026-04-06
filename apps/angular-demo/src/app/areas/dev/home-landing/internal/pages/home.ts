import { Component, VERSION } from '@angular/core';
import { PageLayout } from '@ht/shared/ui-common/layouts/page';
import { NgIcon } from '@ng-icons/core';

@Component({
  selector: 'ht-home-home',
  imports: [PageLayout, NgIcon],
  template: `
    <app-ui-page title="This Starter">
      <p>
        This is what I use as a template when starting a new Angular application. This "dev" section
        is just "meta" stuff - explanations of the various configurations and tools used in the
        starter, some examples, etc.
      </p>
      <p class="alert alert-info my-4">
        This route and content is only included during development mode.
      </p>
      <div class="flex flex-row gap-4 content-start items-start py-8">
        <a class="alert alert-neutral  " href="https://angular.io/" target="_blank">
          <p class="font-bold">
            <ng-icon name="lucideLink" class="size-4"></ng-icon> Angular Version: {{ version }}
          </p>
        </a>
        <a
          class="alert alert-neutral "
          target="_blank"
          href="https://github.com/HypertheoryTraining/angular-starter-2026"
          ><ng-icon name="lucideLink" class="size-4"></ng-icon> GitHub Repo</a
        >
      </div>
    </app-ui-page>
  `,
  styles: ``,
})
export class HomePage {
  version = VERSION.full;
}
