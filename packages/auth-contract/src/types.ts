export type AuthStatus =
  | 'UNINITIALIZED'
  | 'AUTHENTICATING'
  | 'AUTHENTICATED'
  | 'TOKEN_REFRESHING'
  | 'SESSION_EXPIRED'
  | 'ERROR'
  | 'LOGGED_OUT';

export interface AuthUser {
  sub: string;
  email: string;
  name: string;
  roles: readonly string[];
  permissions: readonly string[];
  tenantId?: string | undefined;
  metadata?: Readonly<Record<string, unknown>> | undefined;
}

export interface AuthTokens {
  accessToken: string;
  idToken: string;
  refreshToken?: string | undefined;
  expiresAt: number;
  tokenType: string;
}

export type AuthState =
  | { status: 'UNINITIALIZED' }
  | { status: 'AUTHENTICATING' }
  | { status: 'AUTHENTICATED'; user: AuthUser; tokens: AuthTokens }
  | { status: 'TOKEN_REFRESHING'; user: AuthUser; tokens: AuthTokens }
  | { status: 'SESSION_EXPIRED'; reason: string }
  | { status: 'ERROR'; error: AuthError; retryCount: number }
  | { status: 'LOGGED_OUT' };

export interface AuthError {
  code: AuthErrorCode;
  message: string;
  timestamp: number;
  recoverable: boolean;
}

export type AuthErrorCode =
  | 'OIDC_INIT_FAILED'
  | 'TOKEN_REFRESH_FAILED'
  | 'NETWORK_ERROR'
  | 'PROVIDER_UNREACHABLE'
  | 'INVALID_STATE'
  | 'SILENT_RENEW_FAILED'
  | 'USER_SESSION_TERMINATED'
  | 'UNKNOWN';

export type AuthEventType =
  | 'AUTH_INITIALIZING'
  | 'AUTH_AUTHENTICATED'
  | 'AUTH_LOGOUT'
  | 'AUTH_TOKEN_REFRESHED'
  | 'AUTH_TOKEN_REFRESH_STARTED'
  | 'AUTH_SESSION_EXPIRED'
  | 'AUTH_ERROR'
  | 'AUTH_RECOVERY_ATTEMPT'
  | 'AUTH_RECOVERY_SUCCESS'
  | 'AUTH_RECOVERY_FAILED';

export interface AuthEvent {
  type: AuthEventType;
  state: AuthState;
  timestamp: number;
  source: 'shell' | 'bus' | 'consumer';
}
