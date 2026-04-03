import { http, HttpHandler, delay, HttpResponse } from 'msw';
import activeScenarios from '../active-scenarios';
import { ProductApiItem, ProductCreateModel } from '../../areas/shopping-cart/shopping-cart-landing/data/product-store';

const ENDPOINT = 'https://store.company.com/products';
const SCENARIO_KEY = `POST ${ENDPOINT}`;

export default [
  http.post(ENDPOINT, async ({ request }) => {
    const scenario = activeScenarios[SCENARIO_KEY] ?? 'created';

    switch (scenario) {
      case 'slow': {
        await delay('real');
        const body = (await request.json()) as ProductCreateModel;
        return HttpResponse.json<ProductApiItem>({ id: crypto.randomUUID(), ...body }, { status: 201 });
      }

      case 'validation-error':
        return HttpResponse.json(
          {
            type: 'https://store.company.com/errors/invalid-product',
            title: 'Validation failed',
            status: 422,
            detail: 'One or more fields failed server-side validation.',
            errors: { price: ['Price must be a positive number.'] },
          },
          { status: 422 },
        );

      case 'conflict':
        return HttpResponse.json(
          {
            type: 'https://store.company.com/errors/duplicate-product',
            title: 'Product already exists',
            status: 409,
            detail: 'A product with this name already exists in the catalog.',
          },
          { status: 409 },
        );

      case 'unauthorized':
        return new HttpResponse(null, { status: 401 });

      case 'server-error':
        return new HttpResponse(null, { status: 500 });

      case 'reset-to-zero':
      case 'created':
      default: {
        await delay();
        const body = (await request.json()) as ProductCreateModel;
        return HttpResponse.json<ProductApiItem>({ id: crypto.randomUUID(), ...body }, { status: 201 });
      }
    }
  }),
] as HttpHandler[];
