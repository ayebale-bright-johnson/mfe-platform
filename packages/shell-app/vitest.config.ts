import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
  },
  resolve: {
    alias: {
      '@module-federation/vite': '/Users/meraki/Desktop/Side/mfe-platform/packages/federation-config/src/__mocks__/module-federation-vite.ts',
      '@mfe/auth-contract/testing': '/Users/meraki/Desktop/Side/mfe-platform/packages/auth-contract/src/testing.ts',
      '@mfe/auth-contract': '/Users/meraki/Desktop/Side/mfe-platform/packages/auth-contract/src/index.ts',
      '@mfe/auth-mfe-consumer': '/Users/meraki/Desktop/Side/mfe-platform/packages/auth-mfe-consumer/src/index.ts',
      '@mfe/auth-shell-provider': '/Users/meraki/Desktop/Side/mfe-platform/packages/auth-shell-provider/src/index.ts',
      '@mfe/federation-config/runtime': '/Users/meraki/Desktop/Side/mfe-platform/packages/federation-config/src/runtime.ts',
      '@mfe/federation-config': '/Users/meraki/Desktop/Side/mfe-platform/packages/federation-config/src/index.ts',
      'remote_orders/OrdersModule': '/Users/meraki/Desktop/Side/mfe-platform/packages/remote-orders/src/OrdersModule.tsx',
      'remote_settings/SettingsModule': '/Users/meraki/Desktop/Side/mfe-platform/packages/remote-settings/src/SettingsModule.tsx',
    },
  },
});
