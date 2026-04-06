import { http, HttpHandler, delay, HttpResponse } from 'msw';
import activeScenarios from '../active-scenarios';
import { ProductApiItem } from '../../areas/shopping-cart/shopping-cart-landing/data/product-store';

const ENDPOINT = 'https://store.company.com/products';
const SCENARIO_KEY = `GET ${ENDPOINT}`;

const typicalProducts: ProductApiItem[] = [
  { id: crypto.randomUUID(), name: 'Mechanical Keyboard', description: 'Tactile switches, RGB backlight', price: 129.99, cost: 65.00 },
  { id: crypto.randomUUID(), name: 'USB-C Hub', description: '7-port hub with 100W PD charging', price: 49.99, cost: 22.00 },
  { id: crypto.randomUUID(), name: 'Monitor Stand', description: 'Adjustable height, cable management tray', price: 34.95, cost: 18.00 },
];

export default [
  http.get(ENDPOINT, async () => {
    const scenario = activeScenarios[SCENARIO_KEY] ?? 'typical';

    switch (scenario) {
      case 'empty':
        return HttpResponse.json([]);

      case 'slow':
        await delay('real');
        return HttpResponse.json(typicalProducts);

      case 'unauthorized':
        return new HttpResponse(null, { status: 401 });

      case 'server-error':
        return new HttpResponse(null, { status: 500 });

      case 'typical':
      default:
        return HttpResponse.json(typicalProducts);
    }
  }),
] as HttpHandler[];
