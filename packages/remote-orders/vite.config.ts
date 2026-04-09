import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { createRemoteFederationConfig } from '@mfe/federation-config';

const { plugins: federationPlugins, build, preview } = createRemoteFederationConfig({
  name: 'remote_orders',
  port: 5001,
  exposes: {
    './OrdersModule': './src/OrdersModule.tsx',
  },
});

export default defineConfig({
  plugins: [react(), ...federationPlugins],
  build,
  preview,
  server: {
    port: 5001,
    cors: true,
    strictPort: true,
  },
});
