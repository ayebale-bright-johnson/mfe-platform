# @mfe/auth-contract

Framework-agnostic authentication contract for the MFE platform. Zero runtime dependencies.

## Public API

- **Types**: `AuthState`, `AuthUser`, `AuthTokens`, `AuthEvent`, `AuthAPI`, etc.
- **`createAuthStateMachine()`**: Strict state machine with validated transitions
- **`getAuthBus()`**: Singleton event bus on `window.__MFE_AUTH_BUS__`
- **`createAuthFetch(api)`**: Fetch wrapper that injects auth headers and handles 401 retry
- **Error classes**: `AuthInvalidTransitionError`, `AuthTimeoutError`, `AuthNotAuthenticatedError`

## Usage

```typescript
import { getAuthBus, createAuthFetch } from '@mfe/auth-contract';
import type { AuthState, AuthAPI } from '@mfe/auth-contract';

const bus = getAuthBus();
bus.subscribe((event) => console.log('Auth event:', event));
```

### Test Utilities

```typescript
import { createMockAuthState, createMockAuthBus, createMockAuthAPI } from '@mfe/auth-contract/testing';
```

## Peer Dependencies

None — this package has zero dependencies.
