import { HttpHandler } from 'msw';
import authHandler from './auth/user';
import cartHandler from './cart/cart';

export const handlers: HttpHandler[] = [...authHandler, ...cartHandler];
