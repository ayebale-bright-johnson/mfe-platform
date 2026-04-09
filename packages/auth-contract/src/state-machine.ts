import type { AuthState, AuthStatus } from './types';
import { AuthInvalidTransitionError } from './errors';

const VALID_TRANSITIONS: Readonly<Record<AuthStatus, readonly AuthStatus[]>> = {
  UNINITIALIZED: ['AUTHENTICATING'],
  AUTHENTICATING: ['AUTHENTICATED', 'ERROR', 'LOGGED_OUT'],
  AUTHENTICATED: ['TOKEN_REFRESHING', 'SESSION_EXPIRED', 'LOGGED_OUT', 'ERROR'],
  TOKEN_REFRESHING: ['AUTHENTICATED', 'SESSION_EXPIRED', 'ERROR'],
  SESSION_EXPIRED: ['AUTHENTICATING', 'LOGGED_OUT'],
  ERROR: ['AUTHENTICATING', 'LOGGED_OUT'],
  LOGGED_OUT: ['AUTHENTICATING'],
};

type StateMachineSubscriber = (state: AuthState) => void;

export interface AuthStateMachine {
  getState(): AuthState;
  transition(nextState: AuthState): AuthState;
  canTransition(to: AuthStatus): boolean;
  subscribe(cb: StateMachineSubscriber): () => void;
}

export function createAuthStateMachine(
  initialState: AuthState = { status: 'UNINITIALIZED' },
): AuthStateMachine {
  let currentState: AuthState = initialState;
  const subscribers = new Set<StateMachineSubscriber>();

  function getState(): AuthState {
    return currentState;
  }

  function canTransition(to: AuthStatus): boolean {
    const allowed = VALID_TRANSITIONS[currentState.status];
    return allowed.includes(to);
  }

  function transition(nextState: AuthState): AuthState {
    if (!canTransition(nextState.status)) {
      throw new AuthInvalidTransitionError(currentState.status, nextState.status);
    }
    currentState = nextState;
    for (const cb of subscribers) {
      try {
        cb(currentState);
      } catch (err) {
        console.error('[AuthStateMachine] Subscriber threw:', err);
      }
    }
    return currentState;
  }

  function subscribe(cb: StateMachineSubscriber): () => void {
    subscribers.add(cb);
    return () => {
      subscribers.delete(cb);
    };
  }

  return { getState, transition, canTransition, subscribe };
}
