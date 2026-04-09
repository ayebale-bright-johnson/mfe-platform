import { federation } from '@module-federation/vite';
import type { Plugin } from 'vite';
import type { SharedConfig } from './types';

export interface MfeRemoteConfig {
  name: string;
  port: number;
  exposes: Record<string, string>;
  sharedDeps?: Record<string, SharedConfig>;
}

const DEFAULT_SHARED: Record<string, SharedConfig> = {
  react: { requiredVersion: '^19.0.0', singleton: true },
  'react-dom': { requiredVersion: '^19.0.0', singleton: true },
  '@mfe/auth-contract': { singleton: true },
};

export function createRemoteFederationConfig(config: MfeRemoteConfig): {
  plugins: Plugin[];
  build: { target: string };
  preview: { port: number; cors: boolean; strictPort: boolean };
} {
  const shared = { ...DEFAULT_SHARED, ...config.sharedDeps };

  return {
    plugins: [
      ...federation({
        name: config.name,
        filename: 'remoteEntry.js',
        exposes: config.exposes,
        shared,
      }),
    ],
    build: {
      target: 'chrome89',
    },
    preview: {
      port: config.port,
      cors: true,
      strictPort: true,
    },
  };
}
