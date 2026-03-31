import { Component, signal } from '@angular/core';
import { SectionLayout, SectionLink } from '@ht/shared/ui-common/layouts/section';

@Component({
  selector: 'ht-landing-home-page',
  imports: [SectionLayout],
  template: `
    <app-ui-section-layout title="Hypertheory Angular Starter 2026" [links]="links()" />
  `,
  styles: ``,
})
export class Home {
  links = signal<SectionLink[]>([]);
}
