import { defineConfig } from 'vitest/config';
import path from 'node:path';

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
      '@module-federation/vite': path.resolve(__dirname, 'src/__mocks__/module-federation-vite.ts'),
    },
  },
});
