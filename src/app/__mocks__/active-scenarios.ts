/**
 * Active scenario selection for MSW handlers.
 * This file is written by msw-lens — do not edit manually.
 * Keys are endpoint paths, values are scenario names defined in the handler.
 */
const activeScenarios: Record<string, string> = {
  '/api/user/': 'server-error',
};

export default activeScenarios;
