import { http, HttpResponse } from 'msw';
import { test } from './playwright.setup.js';

test('displays the user dashboard - default dev mock', async ({ network, page }) => {
  await page.goto('/profile');
  await page.waitForSelector('[data-test="profile-name"]');

  const name = await page.locator('[data-test="profile-name"] dd').textContent();
  await test.expect(name).toBe(' Tracy Student ');
});

test('displays the user dashboard', async ({ network, page }) => {
  network.use(
    http.get('/api/user', () => {
      return HttpResponse.json({
        sub: '8c5cda73-b2d9-4dc8-9356-64e1304ddb3b',
        name: 'Jeffry Gonzalez',
        given_name: 'Jeffry',
        family_name: 'Gonzalez',
        preferred_username: 'jeffry',
        email: 'jeffry@hypertheory.com',
        role: ['Instructor', 'Employee'],
      });
    }),
  );

  await page.goto('/profile');
  await page.waitForSelector('[data-test="profile-name"]');

  const name = await page.locator('[data-test="profile-name"] dd').textContent();
  await test.expect(name).toBe(' Jeffry Gonzalez ');
});

test('displays the user with one role', async ({ network, page }) => {
  network.use(
    http.get('/api/user', () => {
      return HttpResponse.json({
        sub: '8c5cda73-b2d9-4dc8-9356-64e1304ddb3b',
        name: 'Jeffry Gonzalez',
        given_name: 'Jeffry',
        family_name: 'Gonzalez',
        preferred_username: 'jeffry',
        email: 'jeffry@hypertheory.com',
        role: 'Stallion',
      });
    }),
  );

  await page.goto('/profile');
  await page.waitForSelector('[data-test="profile-name"]');

  const name = await page.locator('[data-test="profile-name"] dd').textContent();
  await test.expect(name).toBe(' Jeffry Gonzalez ');
});
