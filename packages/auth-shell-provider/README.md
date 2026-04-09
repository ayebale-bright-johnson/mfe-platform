# @mfe/auth-shell-provider

Shell-side OIDC integration for the MFE platform. Wraps `oidc-client-ts` and publishes auth state to the shared AuthBus.

## Public API

- **`ShellAuthProvider`**: React context provider that manages OIDC lifecycle
- **`useShellAuth()`**: Hook to access AuthAPI from within the shell
- **`OidcCallback`**: Component for handling OIDC redirect callbacks
- **`createOidcConfig(config)`**: Typed config builder for oidc-client-ts

## Usage

```tsx
import { ShellAuthProvider } from '@mfe/auth-shell-provider';

function App() {
  return (
    <ShellAuthProvider config={{
      authority: 'https://your-idp.example.com',
      clientId: 'mfe-shell',
      redirectUri: 'http://localhost:5173/callback',
      postLogoutRedirectUri: 'http://localhost:5173',
      scope: 'openid profile email',
    }}>
      <YourApp />
    </ShellAuthProvider>
  );
}
```

## Peer Dependencies

- `@mfe/auth-contract`
- `react` ^18.0.0
- `react-dom` ^18.0.0
