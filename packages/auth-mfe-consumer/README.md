# @mfe/auth-mfe-consumer

MFE-side React hooks and authorization guard components for the MFE platform.

## Public API

- **`useMfeAuth()`**: Hook that reads auth state from the AuthBus and provides AuthAPI methods
- **`useAuthFetch()`**: Hook that returns an authenticated fetch function
- **`RequireAuth`**: Guard that renders children only when authenticated
- **`RequirePermission`**: Guard that checks user permissions
- **`RequireRole`**: Guard that checks user roles
- **`AuthErrorBoundary`**: Error boundary for auth-related errors

## Usage

```tsx
import { useMfeAuth, RequireAuth, RequirePermission } from '@mfe/auth-mfe-consumer';

function MyMfeModule() {
  const { state } = useMfeAuth();

  return (
    <RequireAuth>
      <RequirePermission permission="orders:read">
        <OrdersList />
      </RequirePermission>
    </RequireAuth>
  );
}
```

## Peer Dependencies

- `@mfe/auth-contract`
- `react` ^18.0.0
- `react-dom` ^18.0.0
