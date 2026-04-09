import { describe, it, expect } from 'vitest';
import { createOidcConfig } from './oidc-config';

describe('createOidcConfig', () => {
  const baseConfig = {
    authority: 'https://idp.example.com',
    clientId: 'test-client',
    redirectUri: 'http://localhost:5173/callback',
    postLogoutRedirectUri: 'http://localhost:5173',
    scope: 'openid profile email',
  };

  it('maps config to UserManagerSettings', () => {
    const result = createOidcConfig(baseConfig);
    expect(result.authority).toBe('https://idp.example.com');
    expect(result.client_id).toBe('test-client');
    expect(result.redirect_uri).toBe('http://localhost:5173/callback');
    expect(result.post_logout_redirect_uri).toBe('http://localhost:5173');
    expect(result.scope).toBe('openid profile email');
  });

  it('defaults automaticSilentRenew to true', () => {
    const result = createOidcConfig(baseConfig);
    expect(result.automaticSilentRenew).toBe(true);
  });

  it('defaults monitorSession to true', () => {
    const result = createOidcConfig(baseConfig);
    expect(result.monitorSession).toBe(true);
  });

  it('generates silent redirect URI from redirect URI', () => {
    const result = createOidcConfig(baseConfig);
    expect(result.silent_redirect_uri).toBe('http://localhost:5173/silent-renew.html');
  });

  it('respects explicit silentRedirectUri', () => {
    const result = createOidcConfig({
      ...baseConfig,
      silentRedirectUri: 'http://localhost:5173/custom-silent.html',
    });
    expect(result.silent_redirect_uri).toBe('http://localhost:5173/custom-silent.html');
  });

  it('merges advanced settings', () => {
    const result = createOidcConfig({
      ...baseConfig,
      advanced: { filterProtocolClaims: true },
    });
    expect(result.filterProtocolClaims).toBe(true);
  });
});
