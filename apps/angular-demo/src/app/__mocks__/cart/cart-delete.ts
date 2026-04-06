import { http, HttpHandler, delay, HttpResponse } from 'msw';
import activeScenarios from '../active-scenarios';

const ENDPOINT = 'https://store.company.com/user/cart/:id';
const SCENARIO_KEY = 'DELETE https://store.company.com/user/cart/:id';

export default [
  http.delete(ENDPOINT, async () => {
    const scenario = activeScenarios[SCENARIO_KEY] ?? 'success';

    switch (scenario) {
      case 'server-error':
        return new HttpResponse(null, { status: 500 });

      case 'slow':
        await delay('real');
        return new HttpResponse(null, { status: 204 });

      case 'success':
      default:
        return new HttpResponse(null, { status: 204 });
    }
  }),
] as HttpHandler[];
