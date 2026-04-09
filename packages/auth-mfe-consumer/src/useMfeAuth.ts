import { useState, useEffect, useMemo } from 'react';
import type { AuthAPI, AuthState, AuthEvent } from '@mfe/auth-contract';
import { getAuthBus } from '@mfe/auth-contract';

declare global {
  interface Window {
    __MFE_AUTH_API__?: AuthAPI | undefined;
  }
}

export function useMfeAuth(): { state: AuthState } & AuthAPI {
  const bus = useMemo(() => getAuthBus(), []);
  const [state, setState] = useState<AuthState>(bus.getState());

  useEffect(() => {
    setState(bus.getState());
    const unsub = bus.subscribe((event: AuthEvent) => {
      setState(event.state);
    });
    return unsub;
  }, [bus]);

  useEffect(() => {
    if (state.status === 'UNINITIALIZED') {
      bus.waitForAuth(10_000).catch(() => { return; });
    }
  }, [state.status, bus]);

  const api = useMemo<AuthAPI>(() => {
    const shellApi = typeof window !== 'undefined' ? window.__MFE_AUTH_API__ : undefined;
    if (shellApi) {
      return shellApi;
    }

    return {
      getState: () => bus.getState(),
      getAccessToken: () => {
        console.warn('[useMfeAuth] No shell AuthAPI — getAccessToken stub called');
        const s = bus.getState();
        if (s.status === 'AUTHENTICATED' || s.status === 'TOKEN_REFRESHING') {
          return Promise.resolve(s.tokens.accessToken);
        }
        return Promise.reject(new Error('Not authenticated (standalone mode)'));
      },
      getAccessTokenSilent: () => {
        console.warn('[useMfeAuth] No shell AuthAPI — getAccessTokenSilent stub called');
        const s = bus.getState();
        if (s.status === 'AUTHENTICATED' || s.status === 'TOKEN_REFRESHING') {
          return Promise.resolve(s.tokens.accessToken);
        }
        return Promise.resolve(null);
      },
      login: () => {
        console.warn('[useMfeAuth] No shell AuthAPI — login stub called');
        return Promise.resolve();
      },
      logout: () => {
        console.warn('[useMfeAuth] No shell AuthAPI — logout stub called');
        return Promise.resolve();
      },
      hasPermission: (permission: string) => {
        const s = bus.getState();
        return s.status === 'AUTHENTICATED' && s.user.permissions.includes(permission);
      },
      hasRole: (role: string) => {
        const s = bus.getState();
        return s.status === 'AUTHENTICATED' && s.user.roles.includes(role);
      },
      hasAnyPermission: (permissions: readonly string[]) => {
        const s = bus.getState();
        return s.status === 'AUTHENTICATED' && permissions.some((p) => s.user.permissions.includes(p));
      },
      hasAllPermissions: (permissions: readonly string[]) => {
        const s = bus.getState();
        return s.status === 'AUTHENTICATED' && permissions.every((p) => s.user.permissions.includes(p));
      },
      subscribe: (cb) => bus.subscribe(cb),
      waitForAuth: (timeoutMs) => bus.waitForAuth(timeoutMs),
    };
  }, [bus]);

  return { state, ...api };
}
