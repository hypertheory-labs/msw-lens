import { computed } from '@angular/core';
import { patchState, signalStore, withComputed, withHooks, withMethods } from '@ngrx/signals';
import { removeEntity, setEntities, updateEntity, withEntities } from '@ngrx/signals/entities';

export type CartApiItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
};

const BASE = 'https://store.company.com/user/cart';

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
    async function patchQuantity(id: string, quantity: number) {
      await fetch(`${BASE}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity }),
      });
    }

    async function deleteItem(id: string) {
      await fetch(`${BASE}/${id}`, { method: 'DELETE' });
    }

    return {
      _load: async () => {
        const cartItems = (await fetch(BASE).then((res) => res.json())) as CartApiItem[];
        patchState(state, setEntities(cartItems));
      },

      incrementQuantity: async (id: string) => {
        const item = state.entityMap()[id];
        if (!item) return;
        const quantity = item.quantity + 1;
        patchState(state, updateEntity({ id, changes: { quantity } }));
        await patchQuantity(id, quantity);
      },

      decrementQuantity: async (id: string) => {
        const item = state.entityMap()[id];
        if (!item) return;
        if (item.quantity <= 1) {
          patchState(state, removeEntity(id));
          await deleteItem(id);
          return;
        }
        const quantity = item.quantity - 1;
        patchState(state, updateEntity({ id, changes: { quantity } }));
        await patchQuantity(id, quantity);
      },

      removeItem: async (id: string) => {
        patchState(state, removeEntity(id));
        await deleteItem(id);
      },
    };
  }),
  withHooks({
    onInit(store) {
      store._load();
    },
  }),
);
