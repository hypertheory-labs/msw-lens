import { Routes } from '@angular/router';
import { Home } from './internal/home';
import { HomePage } from './internal/pages/home';
import { cartStore } from './data/cart-store';
import { CartPage } from './internal/pages/cart';
import { AddProductPage } from './internal/pages/add-product';
import { productStore } from './data/product-store';

export const shoppingCartFeatureRoutes: Routes = [
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
      {
        path: 'add-product',
        component: AddProductPage,
        providers: [productStore],
      },
    ],
  },
];
