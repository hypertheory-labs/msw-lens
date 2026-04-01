import { HttpHandler } from 'msw';
import authHandler from './auth/user';

export const handlers: HttpHandler[] = [...authHandler];
