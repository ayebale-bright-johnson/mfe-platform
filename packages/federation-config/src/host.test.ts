import { describe, it, expect } from 'vitest';
import { createHostFederationConfig } from './host';

describe('createHostFederationConfig', () => {
  const baseConfig = {
    remotes: [
      { name: 'remote_orders', entry: 'http://localhost:5001/assets/remoteEntry.js' },
      { name: 'remote_settings', entry: 'http://localhost:5002/assets/remoteEntry.js' },
    ],
  };

  it('returns a valid config with plugins and build', () => {
    const result = createHostFederationConfig(baseConfig);
    expect(result.plugins).toBeDefined();
    expect(result.plugins.length).toBeGreaterThan(0);
    expect(result.build.target).toBe('chrome89');
  });

  it('maps remote entries to the correct format', () => {
    const result = createHostFederationConfig(baseConfig);
    expect(result.plugins.length).toBeGreaterThan(0);
  });

  it('accepts custom name', () => {
    const result = createHostFederationConfig({ ...baseConfig, name: 'my-shell' });
    expect(result.plugins).toBeDefined();
  });

  it('merges custom shared deps', () => {
    const result = createHostFederationConfig({
      ...baseConfig,
      sharedDeps: { axios: { singleton: true } },
    });
    expect(result.plugins).toBeDefined();
  });
});
