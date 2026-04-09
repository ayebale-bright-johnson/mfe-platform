import { describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { createMockAuthState, createMockAuthAPI, createMockAuthBus } from '@mfe/auth-contract/testing';
import type { AuthState } from '@mfe/auth-contract';
import { RequireAuth } from './RequireAuth';

function setupMockAuth(state: AuthState): void {
  const bus = createMockAuthBus(state);
  window.__MFE_AUTH_BUS__ = bus;
  window.__MFE_AUTH_API__ = createMockAuthAPI(state);
}

beforeEach(() => {
  delete window.__MFE_AUTH_BUS__;
  delete window.__MFE_AUTH_API__;
});

describe('RequireAuth', () => {
  it('renders children when AUTHENTICATED', () => {
    setupMockAuth(createMockAuthState());
    render(
      React.createElement(RequireAuth, null,
        React.createElement('div', null, 'Protected content'),
      ),
    );
    expect(screen.getByText('Protected content')).toBeDefined();
  });

  it('renders loading fallback when AUTHENTICATING', () => {
    setupMockAuth({ status: 'AUTHENTICATING' });
    render(
      React.createElement(RequireAuth, { loadingFallback: React.createElement('div', null, 'Loading...') },
        React.createElement('div', null, 'Protected'),
      ),
    );
    expect(screen.getByText('Loading...')).toBeDefined();
  });

  it('renders error fallback with retry when ERROR', () => {
    setupMockAuth({
      status: 'ERROR',
      error: { code: 'UNKNOWN', message: 'Something broke', timestamp: Date.now(), recoverable: true },
      retryCount: 0,
    });
    render(
      React.createElement(RequireAuth, null,
        React.createElement('div', null, 'Protected'),
      ),
    );
    expect(screen.getByRole('alert')).toBeDefined();
    expect(screen.getByText('Retry')).toBeDefined();
  });

  it('shows redirect message when LOGGED_OUT', () => {
    setupMockAuth({ status: 'LOGGED_OUT' });
    render(
      React.createElement(RequireAuth, { autoLogin: false },
        React.createElement('div', null, 'Protected'),
      ),
    );
    expect(screen.getByText('Redirecting to login...')).toBeDefined();
  });
});
