import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'cart' },
  {
    path: 'cart',
    loadComponent: () => import('./features/cart/cart-inline').then((m) => m.CartInline),
  },
  {
    path: 'cart-external',
    loadComponent: () => import('./features/cart/cart-external').then((m) => m.CartExternal),
  },
  { path: '**', redirectTo: 'cart' },
];
