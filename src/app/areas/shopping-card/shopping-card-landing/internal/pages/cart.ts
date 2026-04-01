import { Component, inject } from '@angular/core';
import { PageLayout } from '@ht/shared/ui-common/layouts/page';
import { cartStore } from '../../data/cart-store';
import { CurrencyPipe } from '@angular/common';

@Component({
  selector: 'app-shopping-pages-cart',
  imports: [PageLayout, CurrencyPipe],
  template: `<app-ui-page title="Your Shopping Cart">
    @for (item of store.currentCart(); track item.id) {
      <div class="flex flex-row gap-4 items-center">
        <div class="font-bold">{{ item.name }}</div>
        <div>Price: {{ item.price | currency }}</div>
        <div>Quantity: {{ item.quantity }}</div>
        <div>Total: {{ item.total | currency }}</div>
      </div>
    }
  </app-ui-page>`,
  styles: ``,
})
export class CartPage {
  store = inject(cartStore);
}
