import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, act } from '@testing-library/react';

const mockSigninRedirectCallback = vi.fn();

vi.mock('oidc-client-ts', () => ({
  UserManager: vi.fn().mockImplementation(() => ({
    signinRedirectCallback: mockSigninRedirectCallback,
  })),
}));

import { OidcCallback } from './OidcCallback';

const testConfig = {
  authority: 'https://idp.example.com',
  clientId: 'test',
  redirectUri: 'http://localhost:5173/callback',
  postLogoutRedirectUri: 'http://localhost:5173',
  scope: 'openid profile',
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('OidcCallback', () => {
  it('successful callback calls onSuccess with return URL', async () => {
    const onSuccess = vi.fn();
    mockSigninRedirectCallback.mockResolvedValue({
      state: { returnUrl: '/dashboard' },
    });

    await act(async () => {
      render(React.createElement(OidcCallback, { config: testConfig, onSuccess }));
    });

    expect(onSuccess).toHaveBeenCalledWith('/dashboard');
  });

  it('failed callback renders error state', async () => {
    mockSigninRedirectCallback.mockRejectedValue(new Error('Invalid state'));

    await act(async () => {
      render(React.createElement(OidcCallback, { config: testConfig }));
    });

    expect(screen.getByRole('alert')).toBeDefined();
    expect(screen.getByText('Authentication Error')).toBeDefined();
  });
});
