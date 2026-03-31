import { HttpHandler } from 'msw';
import authHandler from './auth/loggedInHandler';

export const handlers: HttpHandler[] = [...authHandler];
