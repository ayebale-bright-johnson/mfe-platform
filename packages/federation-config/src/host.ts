import { federation } from '@module-federation/vite';
import type { Plugin } from 'vite';
import type { SharedConfig } from './types';

export interface MfeRemoteEntry {
  name: string;
  entry: string;
}

export interface MfeHostConfig {
  name?: string;
  remotes: MfeRemoteEntry[];
  sharedDeps?: Record<string, SharedConfig>;
}

const DEFAULT_SHARED: Record<string, SharedConfig> = {
  react: { requiredVersion: '^19.0.0', singleton: true },
  'react-dom': { requiredVersion: '^19.0.0', singleton: true },
  '@mfe/auth-contract': { singleton: true },
};

export function createHostFederationConfig(config: MfeHostConfig): {
  plugins: Plugin[];
  build: { target: string };
} {
  const remotes: Record<string, { type: string; name: string; entry: string }> = {};
  for (const remote of config.remotes) {
    remotes[remote.name] = {
      type: 'module',
      name: remote.name,
      entry: remote.entry,
    };
  }

  const shared = { ...DEFAULT_SHARED, ...config.sharedDeps };

  return {
    plugins: [
      ...federation({
        name: config.name ?? 'host',
        remotes,
        shared,
        dts: false,
      }),
    ],
    build: {
      target: 'chrome89',
    },
  };
}
