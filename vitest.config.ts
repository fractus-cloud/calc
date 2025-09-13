import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/lib/__tests__/**/*.test.ts'],
    exclude: ['tests/e2e/**'],
  }
});
