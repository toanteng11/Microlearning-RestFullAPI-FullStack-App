import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    exclude: ['tests/integration/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary'],
      include: ['src/**/*.ts'],
      exclude: ['src/server.ts', 'src/**/*.model.ts', 'src/**/*.repository.ts', 'src/types/**'],
      thresholds: {
        statements: 75,
        branches: 45,
        functions: 70,
        lines: 75,
      },
    },
  },
});
