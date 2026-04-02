import { http, HttpHandler, delay, HttpResponse } from 'msw';
import activeScenarios from '../active-scenarios';
import { AuthUser } from '../../areas/shared/util-auth/internal/types';

const loggedInUser: AuthUser = {
  sub: '8c5cda73-b2d9-4dc8-9356-64e1304ddb3b',
  name: 'Tracy Student',
  given_name: 'Tracy',
  family_name: 'Student',
  preferred_username: 'Tracy',
  email: 'tracey@compuserve.com',
  role: ['Student', 'Employee'],
};

export default [
  http.get('/api/user/', async () => {
    const scenario = activeScenarios['GET /api/user/'] ?? 'logged-in';

    switch (scenario) {
      case 'logged-out':
        return new HttpResponse(null, { status: 401 });

      case 'slow':
        await delay('real');
        return HttpResponse.json(loggedInUser);

      case 'server-error':
        return new HttpResponse(null, { status: 500 });

      case 'admin':
        return HttpResponse.json({ ...loggedInUser, role: ['Student', 'Employee', 'Admin'] });

      case 'logged-in':
      default:
        await delay();
        return HttpResponse.json(loggedInUser);
    }
  }),
] as HttpHandler[];
