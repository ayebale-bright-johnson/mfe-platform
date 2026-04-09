import { describe, it, expect } from 'vitest';
import { AuthInvalidTransitionError, AuthTimeoutError, AuthNotAuthenticatedError } from './errors';

describe('AuthInvalidTransitionError', () => {
  it('has correct name and properties', () => {
    const err = new AuthInvalidTransitionError('UNINITIALIZED', 'AUTHENTICATED');
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe('AuthInvalidTransitionError');
    expect(err.from).toBe('UNINITIALIZED');
    expect(err.to).toBe('AUTHENTICATED');
    expect(err.message).toContain('UNINITIALIZED');
    expect(err.message).toContain('AUTHENTICATED');
  });
});

describe('AuthTimeoutError', () => {
  it('has correct name and properties', () => {
    const err = new AuthTimeoutError(5000);
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe('AuthTimeoutError');
    expect(err.timeoutMs).toBe(5000);
  });
});

describe('AuthNotAuthenticatedError', () => {
  it('has correct name and properties', () => {
    const err = new AuthNotAuthenticatedError('LOGGED_OUT');
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe('AuthNotAuthenticatedError');
    expect(err.status).toBe('LOGGED_OUT');
  });
});
