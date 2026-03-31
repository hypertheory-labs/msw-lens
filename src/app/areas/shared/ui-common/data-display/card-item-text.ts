import { Component, input } from '@angular/core';

@Component({
  selector: 'app-ui-data-display-card-text-item',
  imports: [],
  template: `
    <div class="flex flex-col sm:flex-row sm:gap-4">
      <dt class="font-semibold min-w-37.5">{{ label() }}</dt>
      <dd class="text-base-content/70">
        @if (isArray(value())) {
          <div class="flex flex-row gap-2 flex-wrap">
            @for (role of value(); track $index) {
              <div class="badge badge-primary">{{ role }}</div>
            }
          </div>
        } @else {
          {{ value() }}
        }
      </dd>
    </div>
  `,
  styles: ``,
})
export class CardItemText {
  label = input.required<string>();
  value = input.required<string | string[]>();

  protected isArray(value: string | string[]): boolean {
    return Array.isArray(value);
  }
}
