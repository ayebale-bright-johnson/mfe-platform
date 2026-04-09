import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getAuthBus } from './bus';
import type { AuthEvent } from './types';

beforeEach(() => {
  delete window.__MFE_AUTH_BUS__;
});

function makeEvent(overrides: Partial<AuthEvent> = {}): AuthEvent {
  return {
    type: 'AUTH_INITIALIZING',
    state: { status: 'AUTHENTICATING' },
    timestamp: Date.now(),
    source: 'shell',
    ...overrides,
  };
}

describe('AuthBus', () => {
  it('getAuthBus returns a singleton', () => {
    const a = getAuthBus();
    const b = getAuthBus();
    expect(a).toBe(b);
  });

  it('starts in UNINITIALIZED state', () => {
    const bus = getAuthBus();
    expect(bus.getState().status).toBe('UNINITIALIZED');
  });

  it('publish transitions state and notifies subscribers', () => {
    const bus = getAuthBus();
    const cb = vi.fn();
    bus.subscribe(cb);

    const event = makeEvent();
    bus.publish(event);

    expect(bus.getState().status).toBe('AUTHENTICATING');
    expect(cb).toHaveBeenCalledWith(event);
  });

  it('subscribe returns a working unsubscribe function', () => {
    const bus = getAuthBus();
    const cb = vi.fn();
    const unsub = bus.subscribe(cb);

    unsub();
    bus.publish(makeEvent());
    expect(cb).not.toHaveBeenCalled();
  });

  it('subscriber isolation: throwing subscriber does not break others', () => {
    const bus = getAuthBus();
    const bad = vi.fn(() => { throw new Error('boom'); });
    const good = vi.fn();
    bus.subscribe(bad);
    bus.subscribe(good);

    bus.publish(makeEvent());
    expect(good).toHaveBeenCalled();
  });

  it('waitForAuth resolves immediately if already AUTHENTICATED', async () => {
    const bus = getAuthBus();
    const mockUser = { sub: '1', email: 'a@b.c', name: 'A', roles: ['user'], permissions: [] };
    const mockTokens = { accessToken: 'x', idToken: 'y', expiresAt: Date.now() + 3600_000, tokenType: 'Bearer' };

    bus.publish(makeEvent({ type: 'AUTH_INITIALIZING', state: { status: 'AUTHENTICATING' } }));
    bus.publish(makeEvent({
      type: 'AUTH_AUTHENTICATED',
      state: { status: 'AUTHENTICATED', user: mockUser, tokens: mockTokens },
    }));

    const state = await bus.waitForAuth(1_000);
    expect(state.status).toBe('AUTHENTICATED');
  });

  it('waitForAuth resolves when state transitions to AUTHENTICATED', async () => {
    const bus = getAuthBus();
    const mockUser = { sub: '1', email: 'a@b.c', name: 'A', roles: ['user'], permissions: [] };
    const mockTokens = { accessToken: 'x', idToken: 'y', expiresAt: Date.now() + 3600_000, tokenType: 'Bearer' };

    const promise = bus.waitForAuth(5_000);

    bus.publish(makeEvent({ type: 'AUTH_INITIALIZING', state: { status: 'AUTHENTICATING' } }));
    bus.publish(makeEvent({
      type: 'AUTH_AUTHENTICATED',
      state: { status: 'AUTHENTICATED', user: mockUser, tokens: mockTokens },
    }));

    const state = await promise;
    expect(state.status).toBe('AUTHENTICATED');
  });

  it('waitForAuth rejects on timeout', async () => {
    const bus = getAuthBus();
    await expect(bus.waitForAuth(50)).rejects.toThrow('timed out');
  });

  it('reset clears state back to UNINITIALIZED', () => {
    const bus = getAuthBus();
    bus.publish(makeEvent());
    expect(bus.getState().status).toBe('AUTHENTICATING');

    bus.reset();
    expect(bus.getState().status).toBe('UNINITIALIZED');
  });
});
