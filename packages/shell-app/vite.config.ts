import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { createHostFederationConfig } from '@mfe/federation-config';

const { plugins: federationPlugins, build } = createHostFederationConfig({
  remotes: [
    { name: 'remote_orders', entry: 'http://localhost:5001/assets/remoteEntry.js' },
    { name: 'remote_settings', entry: 'http://localhost:5002/assets/remoteEntry.js' },
  ],
});

export default defineConfig({
  plugins: [react(), ...federationPlugins],
  build,
});
