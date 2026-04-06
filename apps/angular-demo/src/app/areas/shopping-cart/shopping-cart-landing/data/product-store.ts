import { signalStore, withMethods, patchState } from '@ngrx/signals';
import { withEntities, addEntity, setEntities } from '@ngrx/signals/entities';

export type ProductApiItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  cost: number;
};

export type ProductCreateModel = Omit<ProductApiItem, 'id'>;

const BASE = 'https://store.company.com/products';

export const productStore = signalStore(
  withEntities<ProductApiItem>(),
  withMethods((state) => {
    async function createProduct(product: ProductCreateModel) {
      const newProduct = (await fetch(BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product),
      }).then((res) => res.json())) as ProductApiItem;
      patchState(state, addEntity(newProduct));
    }

    return {
      _load: async () => {
        const products = (await fetch(BASE).then((res) => res.json())) as ProductApiItem[];
        patchState(state, setEntities(products));
      },

      createProduct,
    };
  }),
);
