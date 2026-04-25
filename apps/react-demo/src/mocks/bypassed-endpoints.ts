/**
 * Bypassed endpoints — written by msw-lens, do not edit manually.
 *
 * Endpoints in this set are filtered out of MSW handler registration so
 * matching requests pass through to the real network. Requires MSW worker
 * started with `onUnhandledRequest: 'bypass'`.
 *
 * Keys are "METHOD path" — same format as active-scenarios.ts.
 */
const bypassed = new Set<string>([
  // 'GET /api/cart',
]);

export default bypassed;
