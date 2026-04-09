import type { AuthState, AuthEvent } from './types';

export interface AuthAPI {
  getState(): AuthState;
  getAccessToken(): Promise<string>;
  getAccessTokenSilent(): Promise<string | null>;
  login(redirectUrl?: string): Promise<void>;
  logout(postLogoutRedirect?: string): Promise<void>;
  hasPermission(permission: string): boolean;
  hasRole(role: string): boolean;
  hasAnyPermission(permissions: readonly string[]): boolean;
  hasAllPermissions(permissions: readonly string[]): boolean;
  subscribe(cb: (event: AuthEvent) => void): () => void;
  waitForAuth(timeoutMs?: number): Promise<AuthState>;
}
