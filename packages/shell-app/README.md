# shell-app

The host/shell application for the MFE platform. Bootstraps auth, provides navigation, and loads federated remotes.

## Development

```bash
npm run dev    # Start dev server on :5173
npm run build  # Build for production
```

## Architecture

- Wraps entire app in `ShellAuthProvider` for OIDC auth
- Uses React Router v6 for routing
- Lazy-loads `remote-orders` and `remote-settings` via Module Federation
- Each remote is wrapped in `RequireAuth` + permission/role guards + `RemoteErrorBoundary`
- `AuthDebugPanel` shows live auth state in dev mode

## Peer Dependencies

Consumes all `@mfe/*` workspace packages.
