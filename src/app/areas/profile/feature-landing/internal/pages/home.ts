import { Component, computed, inject } from '@angular/core';
import { PageLayout } from '@ht/shared/ui-common/layouts/page';
import { authStore } from '@ht/shared/util-auth/store';
import { DataDisplayCard } from '@ht/shared/ui-common/data-display/card';
import { CardItemText } from '@ht/shared/ui-common/data-display/card-item-text';

@Component({
  selector: 'app-profile-home',
  imports: [PageLayout, DataDisplayCard, CardItemText],
  template: `
    <app-ui-page title="Profile">
      <app-ui-data-display-card title="Your User Information" , subTitle="What We Track About You">
        <!-- Full name -->
        <app-ui-data-display-card-text-item
          data-test="profile-name"
          label="Full name"
          [value]="profile()?.name ?? ''"
        ></app-ui-data-display-card-text-item>

        <!-- Application for -->
        <app-ui-data-display-card-text-item
          label="First (Given) Name"
          [value]="profile()?.given_name ?? ''"
        ></app-ui-data-display-card-text-item>

        <app-ui-data-display-card-text-item
          label="Last (Family) Name"
          [value]="profile()?.family_name ?? ''"
        ></app-ui-data-display-card-text-item>

        <app-ui-data-display-card-text-item
          label="Email Address"
          [value]="profile()?.email ?? ''"
        ></app-ui-data-display-card-text-item>

        <app-ui-data-display-card-text-item
          label="Subject Identifier (ID)"
          [value]="profile()?.sub ?? ''"
        ></app-ui-data-display-card-text-item>

        <app-ui-data-display-card-text-item
          label="Roles"
          [value]="profile()?.role ?? ''"
        ></app-ui-data-display-card-text-item>
        <!-- Job title -->
      </app-ui-data-display-card>
    </app-ui-page>
  `,
  styles: ``,
})
export class HomePage {
  store = inject(authStore);

  profile = computed(() => this.store.authResource.value());
}
