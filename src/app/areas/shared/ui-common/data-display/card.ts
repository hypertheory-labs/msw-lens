import { Component, input } from '@angular/core';

@Component({
  selector: 'app-ui-data-display-card',
  imports: [],
  template: `
    <div class="card bg-base-100 shadow-xl">
      <div class="card-body">
        <h2 class="card-title text-2xl">{{ title() }}</h2>
        <p class="text-base-content/70">{{ subTitle() }}</p>

        <div class="divider"></div>
        <div class="grid gap-4">
          <ng-content />
        </div>
      </div>
    </div>
  `,
  styles: ``,
})
export class DataDisplayCard {
  title = input.required<string>();
  subTitle = input.required<string>();
}
