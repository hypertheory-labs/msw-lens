import { computed } from '@angular/core';
import { StatusChangeEvent } from '@angular/forms';
import { mapToResolve } from '@angular/router';
import { patchState, signalStore, withComputed, withHooks, withMethods } from '@ngrx/signals';
import { setEntities, withEntities } from '@ngrx/signals/entities';

export type CartApiItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
};

export const cartStore = signalStore(
  withEntities<CartApiItem>(),
  withComputed((state) => {
    return {
      currentCart: computed(() =>
        state.entities().map((c) => ({ ...c, total: c.price * c.quantity })),
      ),
    };
  }),
  withMethods((state) => {
    return {
      _load: async () => {
        const cartItems = (await fetch('https://store.company.com/user/cart').then((res) =>
          res.json(),
        )) as CartApiItem[];
        patchState(state, setEntities(cartItems));
      },
    };
  }),
  withHooks({
    onInit(store) {
      store._load();
    },
  }),
);
