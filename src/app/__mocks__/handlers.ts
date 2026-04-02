import { HttpHandler } from 'msw';
import authHandler from './auth/user';
import cartHandler from './cart/cart';
import cartPatchHandler from './cart/cart-patch';
import cartDeleteHandler from './cart/cart-delete';

export const handlers: HttpHandler[] = [
  ...authHandler,
  ...cartHandler,
  ...cartPatchHandler,
  ...cartDeleteHandler,
];
