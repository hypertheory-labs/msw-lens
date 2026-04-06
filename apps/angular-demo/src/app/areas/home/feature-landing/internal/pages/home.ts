import { Component } from '@angular/core';
import { PageLayout } from '@ht/shared/ui-common/layouts/page';

@Component({
  selector: 'ht-home-home',
  imports: [PageLayout],
  template: `
    <app-ui-page title="Angular">
      <p>Welcome to the Angular Starter Project!</p>
    </app-ui-page>
  `,
  styles: ``,
})
export class HomePage {}
