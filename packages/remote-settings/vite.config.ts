import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { createRemoteFederationConfig } from '@mfe/federation-config';

const { plugins: federationPlugins, build, preview } = createRemoteFederationConfig({
  name: 'remote_settings',
  port: 5002,
  exposes: {
    './SettingsModule': './src/SettingsModule.tsx',
  },
});

export default defineConfig({
  plugins: [react(), ...federationPlugins],
  build,
  preview,
  server: {
    port: 5002,
    cors: true,
    strictPort: true,
  },
});
