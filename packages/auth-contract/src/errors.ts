import type { AuthStatus } from './types';

export class AuthInvalidTransitionError extends Error {
  public readonly from: AuthStatus;
  public readonly to: AuthStatus;

  constructor(from: AuthStatus, to: AuthStatus) {
    super(`Invalid auth state transition: ${from} → ${to}`);
    this.name = 'AuthInvalidTransitionError';
    this.from = from;
    this.to = to;
  }
}

export class AuthTimeoutError extends Error {
  public readonly timeoutMs: number;

  constructor(timeoutMs: number) {
    super(`Auth wait timed out after ${String(timeoutMs)}ms`);
    this.name = 'AuthTimeoutError';
    this.timeoutMs = timeoutMs;
  }
}

export class AuthNotAuthenticatedError extends Error {
  public readonly status: AuthStatus;

  constructor(status: AuthStatus) {
    super(`Cannot get access token: auth status is ${status}`);
    this.name = 'AuthNotAuthenticatedError';
    this.status = status;
  }
}
