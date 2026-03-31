import { Routes } from '@angular/router';
import { HomePage } from '@ht/home/feature-landing/internal/pages/home';
import { Home } from './internal/home';

export const homeLandingFeatureRoutes: Routes = [
  {
    path: '',
    component: Home,
    children: [
      {
        path: '',
        component: HomePage,
      },
    ],
  },
];
