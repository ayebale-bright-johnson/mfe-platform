import type { AuthAPI } from './api';
import type { AuthEvent } from './types';
import { getAuthBus } from './bus';

function safePublish(event: AuthEvent): void {
  try {
    const bus = getAuthBus();
    bus.publish(event);
  } catch {
    console.warn('[createAuthFetch] Could not publish event:', event.type);
  }
}

export function createAuthFetch(api: AuthAPI): typeof fetch {
  return async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const token = await api.getAccessToken();
    const headers = new Headers(init?.headers);
    headers.set('Authorization', `Bearer ${token}`);

    const makeRequest = (): Promise<Response> =>
      fetch(input, { ...init, headers });

    let response: Response;
    try {
      response = await makeRequest();
    } catch (err) {
      safePublish({
        type: 'AUTH_ERROR',
        state: {
          status: 'ERROR',
          error: {
            code: 'NETWORK_ERROR',
            message: err instanceof Error ? err.message : 'Network error',
            timestamp: Date.now(),
            recoverable: true,
          },
          retryCount: 0,
        },
        timestamp: Date.now(),
        source: 'bus',
      });
      throw err;
    }

    if (response.status === 401) {
      const refreshedToken = await api.getAccessTokenSilent();
      if (refreshedToken !== null) {
        headers.set('Authorization', `Bearer ${refreshedToken}`);
        const retryResponse = await fetch(input, { ...init, headers });
        if (retryResponse.status === 401) {
          safePublish({
            type: 'AUTH_SESSION_EXPIRED',
            state: { status: 'SESSION_EXPIRED', reason: 'Token refresh failed on 401 retry' },
            timestamp: Date.now(),
            source: 'bus',
          });
        }
        return retryResponse;
      }
      safePublish({
        type: 'AUTH_SESSION_EXPIRED',
        state: { status: 'SESSION_EXPIRED', reason: 'Unable to refresh token after 401' },
        timestamp: Date.now(),
        source: 'bus',
      });
    }

    return response;
  };
}
