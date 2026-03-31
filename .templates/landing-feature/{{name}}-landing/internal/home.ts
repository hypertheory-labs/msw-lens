import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { SectionLayout, SectionLink } from '@ht/shared/ui-common/layouts/section';

@Component({
  selector: 'app-{{name}}-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SectionLayout],
  template: ` <app-ui-section-layout title="{{ name }}" [links]="links()" /> `,
  styles: ``,
})
export class Home {
  links = signal<SectionLink[]>([]);
}
