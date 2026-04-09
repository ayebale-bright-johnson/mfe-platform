# remote-settings

Example MFE: Settings panel. Exposes `./SettingsModule` via Module Federation.

## Development

```bash
npm run dev    # Start standalone dev server on :5002
```

Standalone mode uses mock auth state from `@mfe/auth-contract/testing`.

## Federated Module

- **Exposed**: `./SettingsModule`
- **Port**: 5002
- **Auth**: Uses `useMfeAuth()` for profile info, `RequireRole('admin')` for user management gating

## Peer Dependencies

- `@mfe/auth-contract`
- `@mfe/auth-mfe-consumer`
- `@mfe/federation-config`
