/**
 * Active scenario selection for MSW handlers.
 * This file is written by msw-lens — do not edit manually.
 * Keys are "METHOD endpoint", values are scenario names defined in the handler.
 */
const activeScenarios: Record<string, string> = {
  'GET /api/user/': 'logged-in',
  'GET https://store.company.com/user/cart': 'zero-price-item',
  'PATCH https://store.company.com/user/cart/:id': 'validation-error',
  'DELETE https://store.company.com/user/cart/:id': 'slow',
};

export default activeScenarios;
