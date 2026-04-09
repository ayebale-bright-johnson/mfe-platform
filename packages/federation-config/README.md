# @mfe/federation-config

Shared Vite Module Federation configuration factories for the MFE platform.

## Public API

- **`createRemoteFederationConfig(config)`**: Generates Vite config for a remote MFE
- **`createHostFederationConfig(config)`**: Generates Vite config for the shell/host
- **`loadRemoteModule(opts)`**: Runtime dynamic remote loading
- **`RemoteErrorBoundary`**: React error boundary for federated component loading
- **`FederationLoadError`**: Typed error class for federation failures

## Usage

```typescript
// In remote vite.config.ts
import { createRemoteFederationConfig } from '@mfe/federation-config';

const { plugins, build, preview } = createRemoteFederationConfig({
  name: 'remote_orders',
  port: 5001,
  exposes: { './OrdersModule': './src/OrdersModule.tsx' },
});
```

## Peer Dependencies

- `react` ^18.0.0
- `react-dom` ^18.0.0
- `vite` ^5.0.0
