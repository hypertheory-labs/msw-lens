import { http, HttpHandler, delay, HttpResponse } from 'msw';

const user = {
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
    await delay();
    return HttpResponse.json(user);
  }),
] as HttpHandler[];
