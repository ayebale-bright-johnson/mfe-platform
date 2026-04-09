import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { AuthBus } from '@mfe/auth-contract';
import { getAuthBus } from '@mfe/auth-contract';
import { createMockAuthState, createMockAuthAPI } from '@mfe/auth-contract/testing';
import { useMfeAuth } from './useMfeAuth';

let bus: AuthBus;

beforeEach(() => {
  delete window.__MFE_AUTH_BUS__;
  delete window.__MFE_AUTH_API__;
  bus = getAuthBus();
});

describe('useMfeAuth', () => {
  it('reads initial state from AuthBus', () => {
    const { result } = renderHook(() => useMfeAuth());
    expect(result.current.state.status).toBe('UNINITIALIZED');
  });

  it('updates when AuthBus publishes new events', () => {
    const { result } = renderHook(() => useMfeAuth());

    act(() => {
      bus.publish({
        type: 'AUTH_INITIALIZING',
        state: { status: 'AUTHENTICATING' },
        timestamp: Date.now(),
        source: 'shell',
      });
    });

    expect(result.current.state.status).toBe('AUTHENTICATING');
  });

  it('uses window.__MFE_AUTH_API__ when available', () => {
    const mockApi = createMockAuthAPI(createMockAuthState());
    window.__MFE_AUTH_API__ = mockApi;

    const { result } = renderHook(() => useMfeAuth());
    expect(result.current.hasPermission('orders:read')).toBe(true);
  });

  it('falls back to bus stubs when shell API is not available', () => {
    delete window.__MFE_AUTH_API__;
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const { result } = renderHook(() => useMfeAuth());

    expect(typeof result.current.login).toBe('function');
    warnSpy.mockRestore();
  });

  it('calls waitForAuth when state is UNINITIALIZED', () => {
    const waitSpy = vi.spyOn(bus, 'waitForAuth').mockResolvedValue(createMockAuthState());
    renderHook(() => useMfeAuth());

    expect(waitSpy).toHaveBeenCalledWith(10_000);
    waitSpy.mockRestore();
  });
});
