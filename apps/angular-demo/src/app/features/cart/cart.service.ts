import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import type { Cart } from '../../types';

export type CartState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; cart: Cart }
  | { status: 'error'; message: string };

@Injectable({ providedIn: 'root' })
export class CartService {
  private http = inject(HttpClient);
  readonly state = signal<CartState>({ status: 'idle' });

  load() {
    this.state.set({ status: 'loading' });
    this.http.get<Cart>('/api/cart').subscribe({
      next: (cart) => this.state.set({ status: 'ready', cart }),
      error: (err) =>
        this.state.set({
          status: 'error',
          message: err?.message ?? String(err),
        }),
    });
  }
}
