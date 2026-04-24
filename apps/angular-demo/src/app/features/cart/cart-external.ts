import { Component, OnInit, inject } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { CartService } from './cart.service';

@Component({
  selector: 'app-cart-external',
  imports: [CurrencyPipe],
  templateUrl: './cart-external.html',
})
export class CartExternal implements OnInit {
  protected cart = inject(CartService);
  ngOnInit() {
    this.cart.load();
  }
}
