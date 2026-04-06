import { Component, inject, input } from '@angular/core';
import { Route, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Icon } from '../icons/icon';
import { appUiStore } from '../../util-prefs/ui.store';
export type SectionLink = Pick<Route, 'path' | 'title'>;
@Component({
  selector: 'app-ui-section-layout',

  template: `
    <!-- Navbar -->
    <nav class="navbar w-full bg-linear-to-r from-base-300 to-base-200">
      <div class="flex flex-row gap-2 justify-items-center items-center">
        <button
          aria-label="open sidebar"
          class="btn btn-circle btn-ghost btn-sm"
          (click)="uiStore.toggleSidebar()"
        >
          <app-ui-icon name="lucideChevronsUpDown" class="size-4 rotate-90" />
        </button>
        <a
          routerLink="."
          class=" text-base-content font-bold btn btn-ghost mr-2"
          [routerLinkActive]="['btn-active']"
          [routerLinkActiveOptions]="{ exact: true }"
          >{{ title() }}</a
        >
        @if (links() && links()!.length > 0) {
          <div class="flex-1">
            <ul class="flex flex-row gap-2 justify-items-end items-end">
              @for (link of links(); track link.path) {
                <li>
                  <a
                    [routerLink]="link.path"
                    class="font-extralight text-xs btn btn-ghost btn-sm"
                    routerLinkActive="btn-active"
                    >{{ link.title }}</a
                  >
                </li>
              }
            </ul>
          </div>
        }
      </div>
      <label class="swap swap-rotate  ml-auto mr-2">
        <input
          type="checkbox"
          class="hidden"
          [checked]="uiStore.theme() === 'nord'"
          (change)="uiStore.toggleTheme()"
        />
        <svg
          class="swap-off h-6 w-6 fill-current"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
        >
          <path
            d="M5.64,17l-.71.71a1,1,0,0,0,0,1.41,1,1,0,0,0,1.41,0l.71-.71A1,1,0,0,0,5.64,17ZM5,12a1,1,0,0,0-1-1H3a1,1,0,0,0,0,2H4A1,1,0,0,0,5,12Zm7-7a1,1,0,0,0,1-1V3a1,1,0,0,0-2,0V4A1,1,0,0,0,12,5ZM5.64,7.05a1,1,0,0,0,.7.29,1,1,0,0,0,.71-.29,1,1,0,0,0,0-1.41l-.71-.71A1,1,0,0,0,4.93,6.34Zm12,.29a1,1,0,0,0,.7-.29l.71-.71a1,1,0,1,0-1.41-1.41L17,5.64a1,1,0,0,0,0,1.41A1,1,0,0,0,17.66,7.34ZM21,11H20a1,1,0,0,0,0,2h1a1,1,0,0,0,0-2Zm-9,8a1,1,0,0,0-1,1v1a1,1,0,0,0,2,0V20A1,1,0,0,0,12,19ZM18.36,17A1,1,0,0,0,17,18.36l.71.71a1,1,0,0,0,1.41,0,1,1,0,0,0,0-1.41ZM12,6.5A5.5,5.5,0,1,0,17.5,12,5.51,5.51,0,0,0,12,6.5Zm0,9A3.5,3.5,0,1,1,15.5,12,3.5,3.5,0,0,1,12,15.5Z"
          />
        </svg>

        <!-- moon icon -->
        <svg
          class="swap-on h-6 w-6 fill-current"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
        >
          <path
            d="M21.64,13a1,1,0,0,0-1.05-.14,8.05,8.05,0,0,1-3.37.73A8.15,8.15,0,0,1,9.08,5.49a8.59,8.59,0,0,1,.25-2A1,1,0,0,0,8,2.36,10.14,10.14,0,1,0,22,14.05,1,1,0,0,0,21.64,13Zm-9.5,6.69A8.14,8.14,0,0,1,7.08,5.22v.27A10.15,10.15,0,0,0,17.22,15.63a9.79,9.79,0,0,0,2.1-.22A8.11,8.11,0,0,1,12.14,19.73Z"
          />
        </svg>
      </label>
    </nav>
    <!-- Page content here -->
    <div class="h-full"><router-outlet /></div>
  `,
  imports: [RouterOutlet, Icon, RouterLink, RouterLinkActive],
})
export class SectionLayout {
  title = input.required<string>();
  links = input<Array<SectionLink> | null>(null);
  uiStore = inject(appUiStore);
}
