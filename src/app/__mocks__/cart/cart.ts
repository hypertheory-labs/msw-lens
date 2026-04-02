import { http, HttpHandler, delay, HttpResponse } from 'msw';
import activeScenarios from '../active-scenarios';
import { CartApiItem } from '../../areas/shopping-card/shopping-card-landing/data/cart-store';

const ENDPOINT = 'https://store.company.com/user/cart';

const typicalItems: CartApiItem[] = [
  { id: '1', name: 'Mechanical Keyboard', price: 129.99, quantity: 1 },
  { id: '2', name: 'USB-C Hub', price: 49.99, quantity: 2 },
  { id: '3', name: 'Monitor Stand', price: 34.95, quantity: 1 },
];

const largeCartItems: CartApiItem[] = Array.from({ length: 12 }, (_, i) => ({
  id: String(i + 1),
  name: `Cart Item ${i + 1}`,
  price: parseFloat((9.99 + i * 3.5).toFixed(2)),
  quantity: i + 1,
}));

export default [
  http.get(ENDPOINT, async () => {
    const scenario = activeScenarios[`GET ${ENDPOINT}`] ?? 'typical';

    switch (scenario) {
      case 'empty':
        return HttpResponse.json([]);

      case 'single-item':
        return HttpResponse.json([typicalItems[0]]);

      case 'large-cart':
        return HttpResponse.json(largeCartItems);

      case 'slow':
        await delay('real');
        return HttpResponse.json(typicalItems);

      case 'unauthorized':
        return new HttpResponse(null, { status: 401 });

      case 'server-error':
        return new HttpResponse(null, { status: 500 });

      case 'zero-price-item':
        return HttpResponse.json([
          ...typicalItems,
          { id: '99', name: 'Promo Item (Free)', price: 0, quantity: 1 },
        ]);

      case 'high-value':
        return HttpResponse.json([
          { id: '1', name: 'Pro Laptop', price: 2499.99, quantity: 2 },
          { id: '2', name: 'External GPU', price: 899.0, quantity: 3 },
          { id: '3', name: 'Studio Monitor', price: 1299.99, quantity: 4 },
        ]);

      case 'typical':
      default:
        await delay();
        return HttpResponse.json(typicalItems);
    }
  }),
] as HttpHandler[];
