import { http, HttpHandler, delay, HttpResponse } from 'msw';
import activeScenarios from '../active-scenarios';
import { ProductApiItem } from '../../areas/shopping-cart/shopping-cart-landing/data/product-store';

const ENDPOINT = 'https://store.company.com/products';

const typicalProducts: ProductApiItem[] = [
  { id: '1', name: 'Mechanical Keyboard', description: 'Tactile 87-key TKL layout', price: 129.99, cost: 62.0 },
  { id: '2', name: 'USB-C Hub', description: '7-port USB-C hub with PD passthrough', price: 49.99, cost: 18.5 },
  { id: '3', name: 'Monitor Stand', description: 'Adjustable aluminum monitor riser', price: 34.95, cost: 12.0 },
];

export default [
  http.get(ENDPOINT, async () => {
    const scenario = activeScenarios[`GET ${ENDPOINT}`] ?? 'typical';

    switch (scenario) {
      case 'empty':
        return HttpResponse.json([]);

      case 'single-item':
        return HttpResponse.json([typicalProducts[0]]);

      case 'slow':
        await delay('real');
        return HttpResponse.json(typicalProducts);

      case 'unauthorized':
        return new HttpResponse(null, { status: 401 });

      case 'server-error':
        return new HttpResponse(null, { status: 500 });

      case 'typical':
      default:
        await delay();
        return HttpResponse.json(typicalProducts);
    }
  }),
] as HttpHandler[];
