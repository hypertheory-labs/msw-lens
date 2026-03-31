import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
  input: ['./open-api-specs/specification.json'],
  output: [
    {
      path: 'src/app/areas/shared/api/',
      postProcess: ['prettier', 'eslint'],
    },
  ],
  plugins: [
    'zod',
    {
      name: '@hey-api/client-angular',
      throwOnError: true,
      bundle: false,
    },
  ],
});
