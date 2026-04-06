import { http, HttpHandler, delay, HttpResponse } from 'msw';
import activeScenarios from '../active-scenarios';
import { ProductApiItem, ProductCreateModel } from '../../areas/shopping-cart/shopping-cart-landing/data/product-store';

const ENDPOINT = 'https://store.company.com/products';
const SCENARIO_KEY = `POST ${ENDPOINT}`;

export default [
  http.post(ENDPOINT, async ({ request }) => {
    const scenario = activeScenarios[SCENARIO_KEY] ?? 'created';
    const body = await request.json() as ProductCreateModel;

    switch (scenario) {
      case 'validation-error':
        return HttpResponse.json(
          {
            type: 'https://store.company.com/errors/validation-failed',
            title: 'Validation failed',
            status: 422,
            detail: 'One or more fields are invalid.',
            errors: { price: ['Price must be greater than cost.'] },
          },
          { status: 422 },
        );

      case 'conflict':
        return HttpResponse.json(
          {
            type: 'https://store.company.com/errors/product-exists',
            title: 'Product already exists',
            status: 409,
            detail: `A product named "${body.name}" already exists.`,
          },
          { status: 409 },
        );

      case 'unauthorized':
        return new HttpResponse(null, { status: 401 });

      case 'forbidden':
        return new HttpResponse(null, { status: 403 });

      case 'server-error':
        return new HttpResponse(null, { status: 500 });

      case 'slow':
        await delay('real');
        return HttpResponse.json(
          { ...body, id: crypto.randomUUID() } as ProductApiItem,
          { status: 201 },
        );

      case 'created':
      default:
        return HttpResponse.json(
          { ...body, id: crypto.randomUUID() } as ProductApiItem,
          { status: 201 },
        );
    }
  }),
] as HttpHandler[];
