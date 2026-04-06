import { Component } from '@angular/core';

@Component({
  selector: 'app-ui-card-grid-layout',
  imports: [],
  template: `
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 h-fit auto-rows-fr    gap-4">
      <ng-content />
    </div>
  `,
  styles: ``,
})
export class CardGrid {}
