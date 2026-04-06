import { Component, input } from '@angular/core';

@Component({
  selector: 'app-ui-page',
  imports: [],
  template: `
    <div class="p-4 bg-base-200 rounded-sm shadow-lg shadow-base-300 m-2">
      <h1 class="text-lg font-bold mb-2 text-accent">{{ title() }}</h1>
      <ng-content />
    </div>
  `,
  styles: ``,
})
export class PageLayout {
  title = input.required<string>();
}
