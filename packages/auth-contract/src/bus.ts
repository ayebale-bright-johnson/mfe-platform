import type { AuthState, AuthEvent } from './types';
import { type AuthStateMachine, createAuthStateMachine } from './state-machine';
import { AuthTimeoutError } from './errors';

export interface AuthBus {
  getState(): AuthState;
  publish(event: AuthEvent): void;
  subscribe(cb: (event: AuthEvent) => void): () => void;
  waitForAuth(timeoutMs?: number): Promise<AuthState>;
  reset(): void;
}

declare global {
  interface Window {
    __MFE_AUTH_BUS__?: AuthBus | undefined;
  }
}

function createAuthBus(): AuthBus {
  let stateMachine: AuthStateMachine = createAuthStateMachine();
  const eventSubscribers = new Set<(event: AuthEvent) => void>();

  function getState(): AuthState {
    return stateMachine.getState();
  }

  function publish(event: AuthEvent): void {
    const current = stateMachine.getState();
    if (current.status !== event.state.status) {
      stateMachine.transition(event.state);
    }
    for (const cb of eventSubscribers) {
      try {
        cb(event);
      } catch (err) {
        console.error('[AuthBus] Subscriber threw:', err);
      }
    }
  }

  function subscribe(cb: (event: AuthEvent) => void): () => void {
    eventSubscribers.add(cb);
    return () => {
      eventSubscribers.delete(cb);
    };
  }

  function waitForAuth(timeoutMs = 10_000): Promise<AuthState> {
    const current = getState();
    if (current.status === 'AUTHENTICATED') {
      return Promise.resolve(current);
    }

    return new Promise<AuthState>((resolve, reject) => {
      const timeout = setTimeout(() => {
        unsub();
        reject(new AuthTimeoutError(timeoutMs));
      }, timeoutMs);

      const unsub = subscribe((event) => {
        if (event.state.status === 'AUTHENTICATED') {
          clearTimeout(timeout);
          unsub();
          resolve(event.state);
        } else if (
          event.state.status === 'ERROR' &&
          !event.state.error.recoverable
        ) {
          clearTimeout(timeout);
          unsub();
          reject(new Error(event.state.error.message));
        }
      });
    });
  }

  function reset(): void {
    stateMachine = createAuthStateMachine();
    eventSubscribers.clear();
  }

  return { getState, publish, subscribe, waitForAuth, reset };
}

export function getAuthBus(): AuthBus {
  if (typeof window !== 'undefined') {
    window.__MFE_AUTH_BUS__ ??= createAuthBus();
    return window.__MFE_AUTH_BUS__;
  }
  return createAuthBus();
}
