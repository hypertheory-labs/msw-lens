import { expect } from '@playwright/test';
import { test } from './playwright.setup';

test('test', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/.*\/home$/);
  await page.getByRole('link', { name: 'Hypertheory Angular Starter' }).click();
  await expect(page.getByRole('navigation')).toContainText('Hypertheory Angular Starter 2026');
});
