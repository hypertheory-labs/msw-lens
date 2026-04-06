import { Component, input } from '@angular/core';

@Component({
  selector: 'app-ui-card-basic',
  imports: [],
  template: `
    <div
      class=" card-border bg-base-100 shadow-lg shadow-base-300 text-secondary-content h-full  flex flex-col content-start justify-items-start  "
    >
      <div class="p-4">
        <h2 class="font-bold text-secondary mb-2">{{ title() }}</h2>

        <ng-content />
      </div>
    </div>
  `,
  styles: ``,
})
export class BasicCard {
  title = input.required<string>();
}
