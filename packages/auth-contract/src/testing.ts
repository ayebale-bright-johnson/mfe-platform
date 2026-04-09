import type { AuthState, AuthUser, AuthEvent } from './types';
import type { AuthAPI } from './api';
import type { AuthBus } from './bus';

export function createMockAuthState(overrides?: Partial<AuthUser>): AuthState & { status: 'AUTHENTICATED' } {
  return {
    status: 'AUTHENTICATED',
    user: {
      sub: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
      roles: ['user'],
      permissions: ['orders:read', 'orders:write'],
      ...overrides,
    },
    tokens: {
      accessToken: 'mock-access-token',
      idToken: 'mock-id-token',
      refreshToken: 'mock-refresh-token',
      expiresAt: Date.now() + 3600_000,
      tokenType: 'Bearer',
    },
  };
}

export function createMockAuthBus(initialState?: AuthState): AuthBus {
  let state: AuthState = initialState ?? { status: 'UNINITIALIZED' };
  const subscribers = new Set<(event: AuthEvent) => void>();

  return {
    getState: () => state,
    publish: (event: AuthEvent) => {
      state = event.state;
      for (const cb of subscribers) {
        try {
          cb(event);
        } catch {
          return;
        }
      }
    },
    subscribe: (cb: (event: AuthEvent) => void) => {
      subscribers.add(cb);
      return () => {
        subscribers.delete(cb);
      };
    },
    waitForAuth: (timeoutMs = 10_000) => {
      if (state.status === 'AUTHENTICATED') {
        return Promise.resolve(state);
      }
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => { reject(new Error('Timeout')); }, timeoutMs);
        const cb = (event: AuthEvent): void => {
          if (event.state.status === 'AUTHENTICATED') {
            clearTimeout(timeout);
            subscribers.delete(cb);
            resolve(event.state);
          }
        };
        subscribers.add(cb);
      });
    },
    reset: () => {
      state = { status: 'UNINITIALIZED' };
      subscribers.clear();
    },
  };
}

export function createMockAuthAPI(state?: AuthState): AuthAPI {
  const authState: AuthState = state ?? createMockAuthState();

  return {
    getState: () => authState,
    getAccessToken: () => {
      if (authState.status === 'AUTHENTICATED' || authState.status === 'TOKEN_REFRESHING') {
        return Promise.resolve(authState.tokens.accessToken);
      }
      return Promise.reject(new Error('Not authenticated'));
    },
    getAccessTokenSilent: () => {
      if (authState.status === 'AUTHENTICATED' || authState.status === 'TOKEN_REFRESHING') {
        return Promise.resolve(authState.tokens.accessToken);
      }
      return Promise.resolve(null);
    },
    login: () => Promise.resolve(),
    logout: () => Promise.resolve(),
    hasPermission: (permission: string) => {
      if (authState.status !== 'AUTHENTICATED') return false;
      return authState.user.permissions.includes(permission);
    },
    hasRole: (role: string) => {
      if (authState.status !== 'AUTHENTICATED') return false;
      return authState.user.roles.includes(role);
    },
    hasAnyPermission: (permissions: readonly string[]) => {
      if (authState.status !== 'AUTHENTICATED') return false;
      return permissions.some((p) => authState.user.permissions.includes(p));
    },
    hasAllPermissions: (permissions: readonly string[]) => {
      if (authState.status !== 'AUTHENTICATED') return false;
      return permissions.every((p) => authState.user.permissions.includes(p));
    },
    subscribe: () => () => { return; },
    waitForAuth: () => Promise.resolve(authState),
  };
}
