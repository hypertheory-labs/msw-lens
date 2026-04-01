import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { SectionLayout, SectionLink } from '@ht/shared/ui-common/layouts/section';

@Component({
  selector: 'ht-shopping-card-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SectionLayout],
  template: `<app-ui-section-layout title="Shopping Card" [links]="links()" />`,
  styles: ``,
})
export class Home {
  links = signal<SectionLink[]>([
    {
      path: 'cart',
      title: 'Your Cart',
    },
  ]);
}
