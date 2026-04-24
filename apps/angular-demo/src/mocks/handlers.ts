import { HttpHandler } from 'msw';
import cartHandler from './cart/cart';

export const handlers: HttpHandler[] = [...cartHandler];
