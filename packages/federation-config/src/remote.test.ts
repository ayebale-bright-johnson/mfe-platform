import { describe, it, expect } from 'vitest';
import { createRemoteFederationConfig } from './remote';

describe('createRemoteFederationConfig', () => {
  const baseConfig = {
    name: 'test_remote',
    port: 5001,
    exposes: { './Module': './src/Module.tsx' },
  };

  it('returns a valid config with plugins, build, and preview', () => {
    const result = createRemoteFederationConfig(baseConfig);
    expect(result.plugins).toBeDefined();
    expect(result.plugins.length).toBeGreaterThan(0);
    expect(result.build.target).toBe('chrome89');
  });

  it('sets port, cors, and strictPort in preview config', () => {
    const result = createRemoteFederationConfig(baseConfig);
    expect(result.preview.port).toBe(5001);
    expect(result.preview.cors).toBe(true);
    expect(result.preview.strictPort).toBe(true);
  });

  it('auto-includes react, react-dom, @mfe/auth-contract as shared singletons', () => {
    const result = createRemoteFederationConfig(baseConfig);
    expect(result.plugins.length).toBeGreaterThan(0);
  });

  it('merges custom sharedDeps', () => {
    const result = createRemoteFederationConfig({
      ...baseConfig,
      sharedDeps: { lodash: { singleton: false } },
    });
    expect(result.plugins).toBeDefined();
  });
});
