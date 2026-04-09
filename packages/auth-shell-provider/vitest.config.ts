import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    typecheck: {
      tsconfig: './tsconfig.test.json',
    },
  },
  resolve: {
    alias: {
      '@mfe/auth-contract': '/Users/meraki/Desktop/Side/mfe-platform/packages/auth-contract/src/index.ts',
    },
  },
});
