import { Routes } from '@angular/router';
import { isDevMode } from '@angular/core';

const realRoutes: Routes = [
  {
    path: 'home',
    loadChildren: () =>
      import('./areas/home/feature-landing/landing.routes').then((r) => r.homeLandingFeatureRoutes),
  },

  {
    path: 'profile',
    loadChildren: () =>
      import('./areas/profile/feature-landing/landing.routes').then(
        (r) => r.profileLandingFeatureRoutes,
      ),
  },
  {
    path: 'shopping-cart',
    loadChildren: () =>
      import('./areas/shopping-cart/shopping-cart-landing/shopping-cart.routes').then(
        (r) => r.shoppingCartFeatureRoutes,
      ),
  },
];

const devRoutes: Routes = [
  {
    path: 'dev',
    loadChildren: () =>
      import('./areas/dev/home-landing/home.routes').then((r) => r.homeFeatureRoutes),
  },
];

const redirectRoutes: Routes = [
  {
    path: '**',
    redirectTo: 'home',
  },
];

export const routes: Routes = [...realRoutes, ...(isDevMode() ? devRoutes : []), ...redirectRoutes];
