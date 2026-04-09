import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { loadRemoteModule } from './dynamic-loader';
import { FederationLoadError } from './errors';

describe('loadRemoteModule', () => {
  let appendChildSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    appendChildSpy = vi.spyOn(document.head, 'appendChild').mockImplementation((el) => {
      if (el instanceof HTMLScriptElement) {
        setTimeout(() => el.onload?.(new Event('load')), 0);
      }
      return el;
    });
  });

  afterEach(() => {
    appendChildSpy.mockRestore();
    for (const key of Object.keys(window)) {
      if (key.startsWith('test_scope')) {
        Object.assign(window, { [key]: undefined });
      }
    }
  });

  it('successful module load returns the expected export', async () => {
    const mockModule = { default: 'hello' };
    (window as Record<string, unknown>)['test_scope'] = {
      get: vi.fn().mockResolvedValue(() => mockModule),
      init: vi.fn().mockResolvedValue(undefined),
    };

    const result = await loadRemoteModule({
      remoteUrl: 'http://localhost:5001/remoteEntry.js',
      scope: 'test_scope',
      module: './Module',
    });

    expect(result).toEqual(mockModule);
  });

  it('timeout throws FederationLoadError', async () => {
    appendChildSpy.mockRestore();
    appendChildSpy = vi.spyOn(document.head, 'appendChild').mockImplementation((el) => el);

    await expect(
      loadRemoteModule({
        remoteUrl: 'http://localhost:9999/remoteEntry.js',
        scope: 'nope',
        module: './Nope',
        timeout: 50,
      }),
    ).rejects.toThrow(FederationLoadError);
  });

  it('missing scope on window throws FederationLoadError', async () => {
    await expect(
      loadRemoteModule({
        remoteUrl: 'http://localhost:5001/remoteEntry.js',
        scope: 'nonexistent_scope',
        module: './Module',
      }),
    ).rejects.toThrow(FederationLoadError);
  });

  it('container without get method throws FederationLoadError', async () => {
    (window as Record<string, unknown>)['test_scope_noget'] = {
      init: vi.fn().mockResolvedValue(undefined),
    };

    await expect(
      loadRemoteModule({
        remoteUrl: 'http://localhost:5001/remoteEntry.js',
        scope: 'test_scope_noget',
        module: './Module',
      }),
    ).rejects.toThrow(FederationLoadError);
  });
});
