import { Routes } from '@angular/router';
import { Home } from './internal/home';
import { HomePage } from './internal/pages/home';
import { cartStore } from './data/cart-store';
import { CartPage } from './internal/pages/cart';

export const shoppingCardFeatureRoutes: Routes = [
  {
    path: '',
    providers: [cartStore],
    component: Home,
    children: [
      {
        path: '',
        component: HomePage,
      },
      {
        path: 'cart',
        component: CartPage,
      },
    ],
  },
];
