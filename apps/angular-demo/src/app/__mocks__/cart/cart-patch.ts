import { http, HttpHandler, delay, HttpResponse } from 'msw';
import activeScenarios from '../active-scenarios';

const ENDPOINT = 'https://store.company.com/user/cart/:id';
const SCENARIO_KEY = 'PATCH https://store.company.com/user/cart/:id';

export default [
  http.patch(ENDPOINT, async () => {
    const scenario = activeScenarios[SCENARIO_KEY] ?? 'success';

    switch (scenario) {
      case 'validation-error':
        return HttpResponse.json(
          {
            type: 'https://store.company.com/errors/invalid-quantity',
            title: 'Invalid quantity',
            status: 400,
            detail: 'Quantity must be a positive integer.',
            errors: { quantity: ['Must be greater than zero.'] },
          },
          { status: 400 },
        );

      case 'server-error':
        return new HttpResponse(null, { status: 500 });

      case 'slow':
        await delay('real');
        return new HttpResponse(null, { status: 202 });

      case 'success':
      default:
        return new HttpResponse(null, { status: 202 });
    }
  }),
] as HttpHandler[];
