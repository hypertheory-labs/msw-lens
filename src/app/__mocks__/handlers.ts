import { HttpHandler } from 'msw';
import authHandler from './auth/user';
import cartHandler from './cart/cart';
import cartPatchHandler from './cart/cart-patch';
import cartDeleteHandler from './cart/cart-delete';
import productsGetHandler from './products/products-get';
import productsPostHandler from './products/products-post';

export const handlers: HttpHandler[] = [
  ...authHandler,
  ...cartHandler,
  ...cartPatchHandler,
  ...cartDeleteHandler,
  ...productsGetHandler,
  ...productsPostHandler,
];
