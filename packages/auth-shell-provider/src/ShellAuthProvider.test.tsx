import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, act } from '@testing-library/react';

type EventCallback = (...args: unknown[]) => void;
const eventHandlers: Record<string, EventCallback[]> = {};

function addHandler(event: string, cb: EventCallback): void {
  if (!eventHandlers[event]) eventHandlers[event] = [];
  eventHandlers[event].push(cb);
}

function fireEvent(event: string, ...args: unknown[]): void {
  for (const cb of eventHandlers[event] ?? []) {
    cb(...args);
  }
}

const mockGetUser = vi.fn();
const mockSigninRedirect = vi.fn();
const mockSigninSilent = vi.fn();
const mockSignoutRedirect = vi.fn();
const mockSigninRedirectCallback = vi.fn();

vi.mock('oidc-client-ts', () => ({
  UserManager: vi.fn().mockImplementation(() => ({
    getUser: mockGetUser,
    signinRedirect: mockSigninRedirect,
    signinSilent: mockSigninSilent,
    signoutRedirect: mockSignoutRedirect,
    signinRedirectCallback: mockSigninRedirectCallback,
    events: {
      addUserLoaded: (cb: EventCallback) => addHandler('userLoaded', cb),
      addUserUnloaded: (cb: EventCallback) => addHandler('userUnloaded', cb),
      addAccessTokenExpiring: (cb: EventCallback) => addHandler('accessTokenExpiring', cb),
      addAccessTokenExpired: (cb: EventCallback) => addHandler('accessTokenExpired', cb),
      addSilentRenewError: (cb: EventCallback) => addHandler('silentRenewError', cb),
      removeUserLoaded: vi.fn(),
    },
  })),
}));

import { ShellAuthProvider, useShellAuth } from './ShellAuthProvider';

const testConfig = {
  authority: 'https://idp.example.com',
  clientId: 'test',
  redirectUri: 'http://localhost:5173/callback',
  postLogoutRedirectUri: 'http://localhost:5173',
  scope: 'openid profile',
};

const mockOidcUser = {
  profile: {
    sub: 'user-1',
    email: 'test@example.com',
    name: 'Test User',
    roles: ['admin'],
    permissions: ['read', 'write'],
  },
  access_token: 'access-123',
  id_token: 'id-123',
  refresh_token: 'refresh-123',
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  token_type: 'Bearer',
  expired: false,
};

function TestConsumer(): React.JSX.Element {
  const auth = useShellAuth();
  const state = auth.getState();
  return React.createElement('div', null,
    React.createElement('span', { 'data-testid': 'status' }, state.status),
    state.status === 'AUTHENTICATED' && React.createElement('span', { 'data-testid': 'user' }, state.user.email),
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  for (const key of Object.keys(eventHandlers)) {
    eventHandlers[key] = [];
  }
  delete window.__MFE_AUTH_BUS__;
  delete window.__MFE_AUTH_API__;
  mockGetUser.mockResolvedValue(null);
  mockSigninSilent.mockResolvedValue(null);
});

describe('ShellAuthProvider', () => {
  it('transitions to AUTHENTICATED when getUser returns a user', async () => {
    mockGetUser.mockResolvedValue(mockOidcUser);

    await act(async () => {
      render(
        React.createElement(ShellAuthProvider, { config: testConfig },
          React.createElement(TestConsumer),
        ),
      );
    });

    expect(screen.getByTestId('status').textContent).toBe('AUTHENTICATED');
    expect(screen.getByTestId('user').textContent).toBe('test@example.com');
  });

  it('transitions to LOGGED_OUT when getUser returns null', async () => {
    mockGetUser.mockResolvedValue(null);

    await act(async () => {
      render(
        React.createElement(ShellAuthProvider, { config: testConfig },
          React.createElement(TestConsumer),
        ),
      );
    });

    expect(screen.getByTestId('status').textContent).toBe('LOGGED_OUT');
  });

  it('userLoaded event publishes AUTHENTICATED to bus', async () => {
    mockGetUser.mockResolvedValue(null);

    await act(async () => {
      render(
        React.createElement(ShellAuthProvider, { config: testConfig },
          React.createElement(TestConsumer),
        ),
      );
    });

    await act(async () => {
      fireEvent('userLoaded', mockOidcUser);
    });

    expect(screen.getByTestId('status').textContent).toBe('AUTHENTICATED');
  });

  it('accessTokenExpiring triggers silent renew', async () => {
    mockGetUser.mockResolvedValue(mockOidcUser);
    mockSigninSilent.mockResolvedValue(mockOidcUser);

    await act(async () => {
      render(
        React.createElement(ShellAuthProvider, { config: testConfig },
          React.createElement(TestConsumer),
        ),
      );
    });

    await act(async () => {
      fireEvent('accessTokenExpiring');
    });

    expect(mockSigninSilent).toHaveBeenCalled();
  });

  it('silentRenewError triggers ERROR state with retry', async () => {
    mockGetUser.mockResolvedValue(mockOidcUser);
    mockSigninSilent.mockRejectedValue(new Error('renew failed'));

    await act(async () => {
      render(
        React.createElement(ShellAuthProvider, { config: testConfig },
          React.createElement(TestConsumer),
        ),
      );
    });

    await act(async () => {
      fireEvent('silentRenewError', new Error('renew failed'));
    });

    expect(screen.getByTestId('status').textContent).toBe('ERROR');
  });

  it('login calls signinRedirect', async () => {
    mockGetUser.mockResolvedValue(mockOidcUser);
    mockSigninRedirect.mockResolvedValue(undefined);

    let authApi: ReturnType<typeof useShellAuth> | null = null;
    function Capture(): React.JSX.Element {
      authApi = useShellAuth();
      return React.createElement('div');
    }

    await act(async () => {
      render(
        React.createElement(ShellAuthProvider, { config: testConfig },
          React.createElement(Capture),
        ),
      );
    });

    await act(async () => {
      await authApi!.login('/dashboard');
    });

    expect(mockSigninRedirect).toHaveBeenCalled();
  });

  it('logout calls signoutRedirect and publishes LOGGED_OUT', async () => {
    mockGetUser.mockResolvedValue(mockOidcUser);
    mockSignoutRedirect.mockResolvedValue(undefined);

    let authApi: ReturnType<typeof useShellAuth> | null = null;
    function Capture(): React.JSX.Element {
      authApi = useShellAuth();
      return React.createElement('div');
    }

    await act(async () => {
      render(
        React.createElement(ShellAuthProvider, { config: testConfig },
          React.createElement(Capture),
        ),
      );
    });

    await act(async () => {
      await authApi!.logout();
    });

    expect(mockSignoutRedirect).toHaveBeenCalled();
  });

  it('sets window.__MFE_AUTH_API__', async () => {
    mockGetUser.mockResolvedValue(mockOidcUser);

    await act(async () => {
      render(
        React.createElement(ShellAuthProvider, { config: testConfig },
          React.createElement(TestConsumer),
        ),
      );
    });

    expect(window.__MFE_AUTH_API__).toBeDefined();
  });

  it('provider unreachable: ERROR state with PROVIDER_UNREACHABLE', async () => {
    mockGetUser.mockRejectedValue(new Error('Network error'));

    await act(async () => {
      render(
        React.createElement(ShellAuthProvider, { config: testConfig },
          React.createElement(TestConsumer),
        ),
      );
    });

    expect(screen.getByTestId('status').textContent).toBe('ERROR');
  });
});
