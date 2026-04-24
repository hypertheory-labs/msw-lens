import { http, HttpHandler, HttpResponse, delay } from 'msw';
import activeScenarios from '../active-scenarios';
import type { Cart } from '../../types';

const ENDPOINT = '/api/cart';

const typicalCart: Cart = {
  items: [
    { id: '1', productId: 'p-widget', name: 'Widget', quantity: 2, price: 9.99 },
    { id: '2', productId: 'p-gadget', name: 'Gadget', quantity: 1, price: 24.5 },
  ],
  total: 44.48,
};

const emptyCart: Cart = { items: [], total: 0 };

export default [
  http.get(ENDPOINT, async () => {
    const scenario = activeScenarios[`GET ${ENDPOINT}`] ?? 'typical';

    switch (scenario) {
      case 'empty':
        return HttpResponse.json(emptyCart);
      case 'unauthorized':
        return new HttpResponse(null, { status: 401 });
      case 'server-error':
        return new HttpResponse(null, { status: 500 });
      case 'slow':
        await delay('real');
        return HttpResponse.json(typicalCart);
      case 'typical':
      default:
        return HttpResponse.json(typicalCart);
    }
  }),
] as HttpHandler[];
