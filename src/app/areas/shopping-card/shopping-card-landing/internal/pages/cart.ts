import { Component, inject } from '@angular/core';
import { PageLayout } from '@ht/shared/ui-common/layouts/page';
import { cartStore } from '../../data/cart-store';
import { CurrencyPipe } from '@angular/common';

@Component({
  selector: 'app-shopping-pages-cart',
  imports: [PageLayout, CurrencyPipe],
  template: `<app-ui-page title="Your Shopping Cart">
    @for (item of store.currentCart(); track item.id) {
      <div class="flex flex-row gap-4 items-center py-2 border-b border-gray-200">
        <div class="font-bold flex-1">{{ item.name }}</div>
        <div class="text-sm text-gray-600">{{ item.price | currency }}</div>
        <div class="flex items-center gap-2">
          <button
            class="w-7 h-7 rounded border border-gray-300 hover:bg-gray-100"
            (click)="store.decrementQuantity(item.id)"
          >−</button>
          <span class="w-6 text-center">{{ item.quantity }}</span>
          <button
            class="w-7 h-7 rounded border border-gray-300 hover:bg-gray-100"
            (click)="store.incrementQuantity(item.id)"
          >+</button>
        </div>
        <div class="w-20 text-right">{{ item.total | currency }}</div>
        <button
          class="text-sm text-red-600 hover:underline"
          (click)="store.removeItem(item.id)"
        >Remove</button>
      </div>
    }
    @empty {
      <p class="text-gray-500 py-4">Your cart is empty.</p>
    }
  </app-ui-page>`,
  styles: ``,
})
export class CartPage {
  store = inject(cartStore);
}
