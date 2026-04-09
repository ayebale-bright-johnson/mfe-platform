import type { UserManagerSettings } from 'oidc-client-ts';

export interface MfeOidcConfig {
  authority: string;
  clientId: string;
  redirectUri: string;
  postLogoutRedirectUri: string;
  scope: string;
  silentRedirectUri?: string | undefined;
  automaticSilentRenew?: boolean | undefined;
  monitorSession?: boolean | undefined;
  advanced?: Partial<UserManagerSettings> | undefined;
}

export function createOidcConfig(config: MfeOidcConfig): UserManagerSettings {
  return {
    authority: config.authority,
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    post_logout_redirect_uri: config.postLogoutRedirectUri,
    scope: config.scope,
    silent_redirect_uri: config.silentRedirectUri ?? `${config.redirectUri.replace(/\/callback.*/, '')}/silent-renew.html`,
    automaticSilentRenew: config.automaticSilentRenew ?? true,
    monitorSession: config.monitorSession ?? true,
    ...config.advanced,
  };
}
