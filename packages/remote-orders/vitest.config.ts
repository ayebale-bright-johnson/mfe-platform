import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
  },
  resolve: {
    alias: {
      '@mfe/auth-contract/testing': '/Users/meraki/Desktop/Side/mfe-platform/packages/auth-contract/src/testing.ts',
      '@mfe/auth-contract': '/Users/meraki/Desktop/Side/mfe-platform/packages/auth-contract/src/index.ts',
      '@mfe/auth-mfe-consumer': '/Users/meraki/Desktop/Side/mfe-platform/packages/auth-mfe-consumer/src/index.ts',
      '@mfe/federation-config': '/Users/meraki/Desktop/Side/mfe-platform/packages/federation-config/src/index.ts',
    },
  },
});
