import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAuthFetch } from './useAuthFetch';
import { createMockAuthAPI, createMockAuthState } from '@mfe/auth-contract/testing';

beforeEach(() => {
  delete window.__MFE_AUTH_BUS__;
  delete window.__MFE_AUTH_API__;
  window.__MFE_AUTH_API__ = createMockAuthAPI(createMockAuthState());
});

describe('useAuthFetch', () => {
  it('returns a fetch function', () => {
    const { result } = renderHook(() => useAuthFetch());
    expect(typeof result.current).toBe('function');
  });
});
