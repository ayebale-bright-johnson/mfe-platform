import { describe, it, expect, vi } from 'vitest';
import { createAuthStateMachine } from './state-machine';
import { AuthInvalidTransitionError } from './errors';
import type { AuthUser, AuthTokens } from './types';

const mockUser: AuthUser = {
  sub: 'u1',
  email: 'test@test.com',
  name: 'Test',
  roles: ['user'],
  permissions: ['read'],
};

const mockTokens: AuthTokens = {
  accessToken: 'at',
  idToken: 'id',
  expiresAt: Date.now() + 3600_000,
  tokenType: 'Bearer',
};

describe('AuthStateMachine', () => {
  it('starts in UNINITIALIZED by default', () => {
    const sm = createAuthStateMachine();
    expect(sm.getState()).toEqual({ status: 'UNINITIALIZED' });
  });

  it('accepts a custom initial state', () => {
    const sm = createAuthStateMachine({ status: 'LOGGED_OUT' });
    expect(sm.getState().status).toBe('LOGGED_OUT');
  });

  describe('valid transitions', () => {
    it('UNINITIALIZED → AUTHENTICATING', () => {
      const sm = createAuthStateMachine();
      const next = sm.transition({ status: 'AUTHENTICATING' });
      expect(next.status).toBe('AUTHENTICATING');
      expect(sm.getState().status).toBe('AUTHENTICATING');
    });

    it('AUTHENTICATING → AUTHENTICATED', () => {
      const sm = createAuthStateMachine({ status: 'AUTHENTICATING' });
      const next = sm.transition({ status: 'AUTHENTICATED', user: mockUser, tokens: mockTokens });
      expect(next.status).toBe('AUTHENTICATED');
    });

    it('AUTHENTICATING → ERROR', () => {
      const sm = createAuthStateMachine({ status: 'AUTHENTICATING' });
      const next = sm.transition({
        status: 'ERROR',
        error: { code: 'OIDC_INIT_FAILED', message: 'fail', timestamp: 1, recoverable: true },
        retryCount: 0,
      });
      expect(next.status).toBe('ERROR');
    });

    it('AUTHENTICATED → TOKEN_REFRESHING', () => {
      const sm = createAuthStateMachine({ status: 'AUTHENTICATED', user: mockUser, tokens: mockTokens });
      const next = sm.transition({ status: 'TOKEN_REFRESHING', user: mockUser, tokens: mockTokens });
      expect(next.status).toBe('TOKEN_REFRESHING');
    });

    it('AUTHENTICATED → SESSION_EXPIRED', () => {
      const sm = createAuthStateMachine({ status: 'AUTHENTICATED', user: mockUser, tokens: mockTokens });
      const next = sm.transition({ status: 'SESSION_EXPIRED', reason: 'expired' });
      expect(next.status).toBe('SESSION_EXPIRED');
    });

    it('AUTHENTICATED → LOGGED_OUT', () => {
      const sm = createAuthStateMachine({ status: 'AUTHENTICATED', user: mockUser, tokens: mockTokens });
      const next = sm.transition({ status: 'LOGGED_OUT' });
      expect(next.status).toBe('LOGGED_OUT');
    });

    it('AUTHENTICATED → ERROR', () => {
      const sm = createAuthStateMachine({ status: 'AUTHENTICATED', user: mockUser, tokens: mockTokens });
      const next = sm.transition({
        status: 'ERROR',
        error: { code: 'NETWORK_ERROR', message: 'fail', timestamp: 1, recoverable: true },
        retryCount: 0,
      });
      expect(next.status).toBe('ERROR');
    });

    it('TOKEN_REFRESHING → AUTHENTICATED', () => {
      const sm = createAuthStateMachine({ status: 'TOKEN_REFRESHING', user: mockUser, tokens: mockTokens });
      const next = sm.transition({ status: 'AUTHENTICATED', user: mockUser, tokens: mockTokens });
      expect(next.status).toBe('AUTHENTICATED');
    });

    it('TOKEN_REFRESHING → SESSION_EXPIRED', () => {
      const sm = createAuthStateMachine({ status: 'TOKEN_REFRESHING', user: mockUser, tokens: mockTokens });
      const next = sm.transition({ status: 'SESSION_EXPIRED', reason: 'failed' });
      expect(next.status).toBe('SESSION_EXPIRED');
    });

    it('TOKEN_REFRESHING → ERROR', () => {
      const sm = createAuthStateMachine({ status: 'TOKEN_REFRESHING', user: mockUser, tokens: mockTokens });
      const next = sm.transition({
        status: 'ERROR',
        error: { code: 'TOKEN_REFRESH_FAILED', message: 'fail', timestamp: 1, recoverable: true },
        retryCount: 1,
      });
      expect(next.status).toBe('ERROR');
    });

    it('SESSION_EXPIRED → AUTHENTICATING', () => {
      const sm = createAuthStateMachine({ status: 'SESSION_EXPIRED', reason: 'x' });
      const next = sm.transition({ status: 'AUTHENTICATING' });
      expect(next.status).toBe('AUTHENTICATING');
    });

    it('SESSION_EXPIRED → LOGGED_OUT', () => {
      const sm = createAuthStateMachine({ status: 'SESSION_EXPIRED', reason: 'x' });
      const next = sm.transition({ status: 'LOGGED_OUT' });
      expect(next.status).toBe('LOGGED_OUT');
    });

    it('ERROR → AUTHENTICATING (recovery)', () => {
      const sm = createAuthStateMachine({
        status: 'ERROR',
        error: { code: 'UNKNOWN', message: 'x', timestamp: 1, recoverable: true },
        retryCount: 0,
      });
      const next = sm.transition({ status: 'AUTHENTICATING' });
      expect(next.status).toBe('AUTHENTICATING');
    });

    it('ERROR → LOGGED_OUT', () => {
      const sm = createAuthStateMachine({
        status: 'ERROR',
        error: { code: 'UNKNOWN', message: 'x', timestamp: 1, recoverable: false },
        retryCount: 0,
      });
      const next = sm.transition({ status: 'LOGGED_OUT' });
      expect(next.status).toBe('LOGGED_OUT');
    });

    it('LOGGED_OUT → AUTHENTICATING', () => {
      const sm = createAuthStateMachine({ status: 'LOGGED_OUT' });
      const next = sm.transition({ status: 'AUTHENTICATING' });
      expect(next.status).toBe('AUTHENTICATING');
    });
  });

  describe('invalid transitions', () => {
    it('UNINITIALIZED → AUTHENTICATED throws', () => {
      const sm = createAuthStateMachine();
      expect(() =>
        sm.transition({ status: 'AUTHENTICATED', user: mockUser, tokens: mockTokens }),
      ).toThrow(AuthInvalidTransitionError);
    });

    it('UNINITIALIZED → LOGGED_OUT throws', () => {
      const sm = createAuthStateMachine();
      expect(() => sm.transition({ status: 'LOGGED_OUT' })).toThrow(AuthInvalidTransitionError);
    });

    it('AUTHENTICATING → SESSION_EXPIRED throws', () => {
      const sm = createAuthStateMachine({ status: 'AUTHENTICATING' });
      expect(() => sm.transition({ status: 'SESSION_EXPIRED', reason: 'x' })).toThrow(AuthInvalidTransitionError);
    });

    it('LOGGED_OUT → AUTHENTICATED throws', () => {
      const sm = createAuthStateMachine({ status: 'LOGGED_OUT' });
      expect(() =>
        sm.transition({ status: 'AUTHENTICATED', user: mockUser, tokens: mockTokens }),
      ).toThrow(AuthInvalidTransitionError);
    });

    it('ERROR → AUTHENTICATED throws', () => {
      const sm = createAuthStateMachine({
        status: 'ERROR',
        error: { code: 'UNKNOWN', message: 'x', timestamp: 1, recoverable: true },
        retryCount: 0,
      });
      expect(() =>
        sm.transition({ status: 'AUTHENTICATED', user: mockUser, tokens: mockTokens }),
      ).toThrow(AuthInvalidTransitionError);
    });
  });

  describe('canTransition', () => {
    it('returns true for valid transitions', () => {
      const sm = createAuthStateMachine();
      expect(sm.canTransition('AUTHENTICATING')).toBe(true);
    });

    it('returns false for invalid transitions', () => {
      const sm = createAuthStateMachine();
      expect(sm.canTransition('AUTHENTICATED')).toBe(false);
      expect(sm.canTransition('LOGGED_OUT')).toBe(false);
      expect(sm.canTransition('ERROR')).toBe(false);
    });
  });

  describe('transition payloads', () => {
    it('AUTHENTICATED state includes user and tokens', () => {
      const sm = createAuthStateMachine({ status: 'AUTHENTICATING' });
      const state = sm.transition({ status: 'AUTHENTICATED', user: mockUser, tokens: mockTokens });
      if (state.status === 'AUTHENTICATED') {
        expect(state.user).toEqual(mockUser);
        expect(state.tokens).toEqual(mockTokens);
      }
    });

    it('ERROR state includes error and retryCount', () => {
      const sm = createAuthStateMachine({ status: 'AUTHENTICATING' });
      const error = { code: 'OIDC_INIT_FAILED' as const, message: 'fail', timestamp: 1, recoverable: true };
      const state = sm.transition({ status: 'ERROR', error, retryCount: 2 });
      if (state.status === 'ERROR') {
        expect(state.error).toEqual(error);
        expect(state.retryCount).toBe(2);
      }
    });

    it('SESSION_EXPIRED state includes reason', () => {
      const sm = createAuthStateMachine({ status: 'AUTHENTICATED', user: mockUser, tokens: mockTokens });
      const state = sm.transition({ status: 'SESSION_EXPIRED', reason: 'Token expired' });
      if (state.status === 'SESSION_EXPIRED') {
        expect(state.reason).toBe('Token expired');
      }
    });
  });

  describe('subscribers', () => {
    it('notifies subscribers on transition', () => {
      const sm = createAuthStateMachine();
      const cb = vi.fn();
      sm.subscribe(cb);
      sm.transition({ status: 'AUTHENTICATING' });
      expect(cb).toHaveBeenCalledWith({ status: 'AUTHENTICATING' });
    });

    it('unsubscribe stops notifications', () => {
      const sm = createAuthStateMachine();
      const cb = vi.fn();
      const unsub = sm.subscribe(cb);
      unsub();
      sm.transition({ status: 'AUTHENTICATING' });
      expect(cb).not.toHaveBeenCalled();
    });

    it('one throwing subscriber does not break others', () => {
      const sm = createAuthStateMachine();
      const bad = vi.fn(() => { throw new Error('boom'); });
      const good = vi.fn();
      sm.subscribe(bad);
      sm.subscribe(good);
      sm.transition({ status: 'AUTHENTICATING' });
      expect(good).toHaveBeenCalled();
    });
  });
});
