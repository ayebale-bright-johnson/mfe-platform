# remote-orders

Example MFE: Orders dashboard. Exposes `./OrdersModule` via Module Federation.

## Development

```bash
npm run dev    # Start standalone dev server on :5001
```

Standalone mode uses mock auth state from `@mfe/auth-contract/testing`.

## Federated Module

- **Exposed**: `./OrdersModule`
- **Port**: 5001
- **Auth**: Uses `useMfeAuth()` for user info, `RequirePermission('orders:write')` for create gating

## Peer Dependencies

- `@mfe/auth-contract`
- `@mfe/auth-mfe-consumer`
- `@mfe/federation-config`
