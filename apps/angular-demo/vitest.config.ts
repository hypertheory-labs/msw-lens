import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    exclude: ['system-tests/**', 'node_modules/**'],
  },
});
