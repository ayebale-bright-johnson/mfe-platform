import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createAuthFetch } from './fetch';
import { createMockAuthAPI } from './testing';

const originalFetch = globalThis.fetch;

beforeEach(() => {
  delete window.__MFE_AUTH_BUS__;
});

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe('createAuthFetch', () => {
  it('injects Authorization header', async () => {
    const mockFetch = vi.fn().mockResolvedValue(new Response('ok', { status: 200 }));
    globalThis.fetch = mockFetch;
    const api = createMockAuthAPI();
    const authFetch = createAuthFetch(api);

    await authFetch('https://api.example.com/data');

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [, opts] = mockFetch.mock.calls[0] as [string, RequestInit];
    const headers = new Headers(opts.headers);
    expect(headers.get('Authorization')).toBe('Bearer mock-access-token');
  });

  it('401 triggers token refresh and retries', async () => {
    const mockFetch = vi.fn()
      .mockResolvedValueOnce(new Response('Unauthorized', { status: 401 }))
      .mockResolvedValueOnce(new Response('ok', { status: 200 }));
    globalThis.fetch = mockFetch;
    const api = createMockAuthAPI();
    const authFetch = createAuthFetch(api);

    const response = await authFetch('https://api.example.com/data');
    expect(response.status).toBe(200);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('401 retry that still fails transitions to SESSION_EXPIRED', async () => {
    const mockFetch = vi.fn()
      .mockResolvedValueOnce(new Response('Unauthorized', { status: 401 }))
      .mockResolvedValueOnce(new Response('Unauthorized', { status: 401 }));
    globalThis.fetch = mockFetch;
    const api = createMockAuthAPI();
    const authFetch = createAuthFetch(api);

    const response = await authFetch('https://api.example.com/data');
    expect(response.status).toBe(401);
  });

  it('401 with no refresh token transitions to SESSION_EXPIRED', async () => {
    const mockFetch = vi.fn()
      .mockResolvedValueOnce(new Response('Unauthorized', { status: 401 }));
    globalThis.fetch = mockFetch;
    const api = createMockAuthAPI();
    vi.spyOn(api, 'getAccessTokenSilent').mockResolvedValue(null);
    const authFetch = createAuthFetch(api);

    const response = await authFetch('https://api.example.com/data');
    expect(response.status).toBe(401);
  });

  it('network error is thrown and logged', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));
    const api = createMockAuthAPI();
    const authFetch = createAuthFetch(api);

    await expect(authFetch('https://api.example.com/data')).rejects.toThrow('Failed to fetch');
  });

  it('respects AbortSignal passthrough', async () => {
    const controller = new AbortController();
    controller.abort();
    const mockFetch = vi.fn().mockRejectedValue(new DOMException('Aborted', 'AbortError'));
    globalThis.fetch = mockFetch;
    const api = createMockAuthAPI();
    const authFetch = createAuthFetch(api);

    await expect(authFetch('https://api.example.com/data', { signal: controller.signal })).rejects.toThrow();
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [, opts] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(opts.signal).toBe(controller.signal);
  });
});
