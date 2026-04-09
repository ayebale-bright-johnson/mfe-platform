import { createContext, useContext, useEffect, useRef, useState, useCallback, useMemo } from 'react';
import type { FC, ReactNode } from 'react';
import { UserManager } from 'oidc-client-ts';
import type { User } from 'oidc-client-ts';
import type { AuthAPI, AuthState, AuthUser, AuthTokens, AuthEvent } from '@mfe/auth-contract';
import { getAuthBus } from '@mfe/auth-contract';
import { type MfeOidcConfig, createOidcConfig } from './oidc-config';

declare global {
  interface Window {
    __MFE_AUTH_API__?: AuthAPI | undefined;
  }
}

const AuthContext = createContext<AuthAPI | null>(null);

function mapUser(user: User): AuthUser {
  const profile = user.profile;
  return {
    sub: profile.sub,
    email: profile.email ?? '',
    name: profile.name ?? '',
    roles: (profile['roles'] as string[] | undefined) ?? [],
    permissions: (profile['permissions'] as string[] | undefined) ?? [],
    tenantId: profile['tenant_id'] as string | undefined,
  };
}

function mapTokens(user: User): AuthTokens {
  return {
    accessToken: user.access_token,
    idToken: user.id_token ?? '',
    refreshToken: user.refresh_token,
    expiresAt: (user.expires_at ?? 0) * 1000,
    tokenType: user.token_type,
  };
}

interface ShellAuthProviderProps {
  config: MfeOidcConfig;
  children?: ReactNode;
}

export const ShellAuthProvider: FC<ShellAuthProviderProps> = ({ config, children }) => {
  const bus = useMemo(() => getAuthBus(), []);
  const [state, setState] = useState<AuthState>(bus.getState());
  const userManagerRef = useRef<UserManager | null>(null);
  const retryCountRef = useRef(0);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const publishEvent = useCallback(
    (type: AuthEvent['type'], authState: AuthState) => {
      const event: AuthEvent = {
        type,
        state: authState,
        timestamp: Date.now(),
        source: 'shell',
      };
      bus.publish(event);
      setState(authState);
    },
    [bus],
  );

  const attemptRecovery = useCallback(
    (um: UserManager) => {
      if (retryCountRef.current >= 3) {
        publishEvent('AUTH_RECOVERY_FAILED', {
          status: 'SESSION_EXPIRED',
          reason: 'Max recovery attempts exceeded',
        });
        return;
      }
      retryCountRef.current += 1;
      const delay = Math.min(1000 * Math.pow(2, retryCountRef.current - 1), 30_000);

      publishEvent('AUTH_RECOVERY_ATTEMPT', {
        status: 'ERROR',
        error: {
          code: 'SILENT_RENEW_FAILED',
          message: `Recovery attempt ${String(retryCountRef.current)}/3`,
          timestamp: Date.now(),
          recoverable: true,
        },
        retryCount: retryCountRef.current,
      });

      retryTimerRef.current = setTimeout(() => {
        um.signinSilent().catch(() => {
          attemptRecovery(um);
        });
      }, delay);
    },
    [publishEvent],
  );

  useEffect(() => {
    const settings = createOidcConfig(config);
    let um: UserManager;
    try {
      um = new UserManager(settings);
    } catch {
      publishEvent('AUTH_ERROR', {
        status: 'ERROR',
        error: {
          code: 'PROVIDER_UNREACHABLE',
          message: 'Failed to create UserManager',
          timestamp: Date.now(),
          recoverable: true,
        },
        retryCount: 0,
      });
      return;
    }
    userManagerRef.current = um;

    um.events.addUserLoaded((user: User) => {
      retryCountRef.current = 0;
      const current = bus.getState();
      if (current.status === 'LOGGED_OUT' || current.status === 'ERROR' || current.status === 'UNINITIALIZED') {
        publishEvent('AUTH_INITIALIZING', { status: 'AUTHENTICATING' });
      }
      publishEvent('AUTH_AUTHENTICATED', {
        status: 'AUTHENTICATED',
        user: mapUser(user),
        tokens: mapTokens(user),
      });
    });

    um.events.addUserUnloaded(() => {
      publishEvent('AUTH_LOGOUT', { status: 'LOGGED_OUT' });
    });

    um.events.addAccessTokenExpiring(() => {
      const current = bus.getState();
      if (current.status === 'AUTHENTICATED') {
        publishEvent('AUTH_TOKEN_REFRESH_STARTED', {
          status: 'TOKEN_REFRESHING',
          user: current.user,
          tokens: current.tokens,
        });
      }
      um.signinSilent().catch(() => {
        attemptRecovery(um);
      });
    });

    um.events.addAccessTokenExpired(() => {
      publishEvent('AUTH_SESSION_EXPIRED', {
        status: 'SESSION_EXPIRED',
        reason: 'Access token expired',
      });
    });

    um.events.addSilentRenewError(() => {
      publishEvent('AUTH_ERROR', {
        status: 'ERROR',
        error: {
          code: 'SILENT_RENEW_FAILED',
          message: 'Silent renew failed',
          timestamp: Date.now(),
          recoverable: true,
        },
        retryCount: retryCountRef.current,
      });
      attemptRecovery(um);
    });

    publishEvent('AUTH_INITIALIZING', { status: 'AUTHENTICATING' });
    um.getUser()
      .then((user) => {
        if (user !== null && user.expired !== true) {
          publishEvent('AUTH_AUTHENTICATED', {
            status: 'AUTHENTICATED',
            user: mapUser(user),
            tokens: mapTokens(user),
          });
        } else {
          publishEvent('AUTH_LOGOUT', { status: 'LOGGED_OUT' });
        }
      })
      .catch(() => {
        publishEvent('AUTH_ERROR', {
          status: 'ERROR',
          error: {
            code: 'PROVIDER_UNREACHABLE',
            message: 'Failed to get user on init',
            timestamp: Date.now(),
            recoverable: true,
          },
          retryCount: 0,
        });
        attemptRecovery(um);
      });

    return () => {
      if (retryTimerRef.current !== null) clearTimeout(retryTimerRef.current);
    };
  }, [config, publishEvent, attemptRecovery, bus]);

  const authApi = useMemo<AuthAPI>(() => {
    const api: AuthAPI = {
      getState: () => state,
      getAccessToken: () => {
        const s = bus.getState();
        if (s.status === 'AUTHENTICATED' || s.status === 'TOKEN_REFRESHING') {
          return Promise.resolve(s.tokens.accessToken);
        }
        return Promise.reject(new Error('Not authenticated'));
      },
      getAccessTokenSilent: async () => {
        const s = bus.getState();
        if (s.status === 'AUTHENTICATED' || s.status === 'TOKEN_REFRESHING') {
          return s.tokens.accessToken;
        }
        try {
          const user = await userManagerRef.current?.signinSilent();
          return user?.access_token ?? null;
        } catch {
          return null;
        }
      },
      login: async (redirectUrl?: string) => {
        await userManagerRef.current?.signinRedirect({
          state: { returnUrl: redirectUrl ?? window.location.pathname },
        });
      },
      logout: async (postLogoutRedirect?: string) => {
        publishEvent('AUTH_LOGOUT', { status: 'LOGGED_OUT' });
        await userManagerRef.current?.signoutRedirect(
          postLogoutRedirect !== undefined
            ? { post_logout_redirect_uri: postLogoutRedirect }
            : {},
        );
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
    window.__MFE_AUTH_API__ = api;
    return api;
  }, [state, bus, publishEvent]);

  return <AuthContext.Provider value={authApi}>{children}</AuthContext.Provider>;
};

export function useShellAuth(): AuthAPI {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useShellAuth must be used within ShellAuthProvider');
  }
  return ctx;
}
