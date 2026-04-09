# MFE Platform

A production-grade micro frontend platform built with React 19, Vite Module Federation (`@module-federation/vite`), and unified OIDC authentication.

## Architecture

This monorepo implements a shell + remote MFE architecture where:
- The **shell** owns OIDC authentication and publishes auth state via a shared bus
- **Remote MFEs** consume auth state through framework-agnostic contracts
- **Module Federation** enables runtime composition of independently deployed frontends

See [Architecture Diagram](./docs/architecture.md) | [Auth Flow](./docs/auth-flow.md) | [State Machine](./docs/auth-state-machine.md)

## How the Pieces Connect

The platform is organized into three layers: **contracts**, **providers**, and **applications**.

**@mfe/auth-contract** is the foundation. It defines every auth type (states, events, tokens, users), a finite state machine that validates transitions between auth states, and an `AuthBus` singleton mounted on `window.__MFE_AUTH_BUS__`. The bus is the only communication channel between the shell and remotes for auth state. It is framework-agnostic — any JavaScript running in the browser can subscribe to it.

**@mfe/auth-shell-provider** wraps `oidc-client-ts` and runs exclusively in the shell. When the shell boots, `ShellAuthProvider` creates a `UserManager`, listens to OIDC events (user loaded, token expiring, silent renew errors), and translates them into `AuthEvent` objects published to the bus. It also exposes an `AuthAPI` object on `window.__MFE_AUTH_API__` with methods like `login()`, `logout()`, `getAccessToken()`, and permission checks. The shell is the only app that ever talks to the OIDC provider.

**@mfe/auth-mfe-consumer** runs inside each remote MFE. The `useMfeAuth()` hook reads the current auth state from the bus and subscribes to updates. If the shell hasn't loaded yet, the hook calls `waitForAuth()` which resolves once the bus transitions to `AUTHENTICATED`. Guard components (`RequireAuth`, `RequirePermission`, `RequireRole`) wrap content with declarative access control. `useAuthFetch()` returns a fetch wrapper that auto-injects Bearer tokens and handles 401 retry with silent refresh.

**@mfe/federation-config** provides factory functions (`createRemoteFederationConfig`, `createHostFederationConfig`) that generate Vite plugin configs for `@module-federation/vite`. Both factories enforce shared singletons for `react`, `react-dom`, and `@mfe/auth-contract` so that every federated module shares one React instance and one auth bus.

**Message flow**: Shell publishes `AUTH_AUTHENTICATED` → bus validates the state transition → bus notifies all subscribers → `useMfeAuth()` in each remote receives the new state → guard components re-evaluate access → UI updates. Token refresh follows the same path: shell detects expiry → publishes `AUTH_TOKEN_REFRESH_STARTED` → attempts silent renew → publishes either `AUTH_AUTHENTICATED` (new tokens) or `AUTH_ERROR` (triggers exponential backoff retry, max 3 attempts).

## Quick Start

### Prerequisites
- Node.js >= 18
- npm >= 9

### Install & Run

```bash
npm install
npm run dev      # Starts shell (:5173) + orders (:5001) + settings (:5002)
```

### Other Commands

```bash
npm run build      # Build all packages in dependency order
npm run typecheck   # TypeScript type checking across all packages
npm test           # Run all tests
npm run test:watch  # Watch mode
npm run test:coverage # Coverage report
npm run clean       # Remove dist/ and node_modules/
```

## Packages

```
mfe-platform/
├── @mfe/auth-contract       # Shared types, AuthBus, state machine, fetch wrapper
├── @mfe/auth-shell-provider  # Shell-side OIDC integration (oidc-client-ts)
├── @mfe/auth-mfe-consumer    # MFE-side React hooks + auth guards
├── @mfe/federation-config    # Vite federation config factories
├── shell-app                 # Host application
├── remote-orders             # Orders MFE (port 5001)
└── remote-settings           # Settings MFE (port 5002)
```

### Dependency Graph

```
shell-app ──> @mfe/auth-shell-provider ──> @mfe/auth-contract
          ──> @mfe/auth-mfe-consumer   ──> @mfe/auth-contract
          ──> @mfe/federation-config

remote-orders   ──> @mfe/auth-mfe-consumer ──> @mfe/auth-contract
                ──> @mfe/federation-config

remote-settings ──> @mfe/auth-mfe-consumer ──> @mfe/auth-contract
                ──> @mfe/federation-config
```

## Adding a New MFE

1. Create a new package in `packages/`:
   ```bash
   mkdir -p packages/remote-my-feature/src
   ```

2. Add `package.json` with workspace dependencies:
   ```json
   {
     "dependencies": {
       "@mfe/auth-contract": "*",
       "@mfe/auth-mfe-consumer": "*",
       "@mfe/federation-config": "*"
     }
   }
   ```

3. Create `vite.config.ts` using the remote factory:
   ```typescript
   import { createRemoteFederationConfig } from '@mfe/federation-config';

   const { plugins, build, preview } = createRemoteFederationConfig({
     name: 'remote_my_feature',
     port: 5003,
     exposes: { './MyFeatureModule': './src/MyFeatureModule.tsx' },
   });
   ```

4. Use `useMfeAuth()` and guard components in your module:
   ```tsx
   import { useMfeAuth, RequireAuth, RequirePermission } from '@mfe/auth-mfe-consumer';

   const MyFeatureModule: FC = () => {
     const { state } = useMfeAuth();
     return (
       <RequireAuth>
         <RequirePermission permission="my-feature:read">
           <YourContent />
         </RequirePermission>
       </RequireAuth>
     );
   };
   export default MyFeatureModule;
   ```

5. Add the remote to the shell's `vite.config.ts`:
   ```typescript
   remotes: [
     // ...existing remotes
     { name: 'remote_my_feature', entry: 'http://localhost:5003/assets/remoteEntry.js' },
   ]
   ```

6. Create a standalone `App.tsx` for independent development using `createMockAuthState()`.

## Auth Integration Guide

### For MFE Developers

Your MFE never touches OIDC directly. Use these tools:

- **`useMfeAuth()`** -- gives you the current auth state + AuthAPI methods
- **`useAuthFetch()`** -- fetch wrapper that auto-injects Bearer tokens
- **`RequireAuth`** -- gate content behind authentication
- **`RequirePermission`** -- gate content behind specific permissions
- **`RequireRole`** -- gate content behind specific roles
- **`AuthErrorBoundary`** -- catch and recover from auth errors

### Standalone Development

Every remote can run independently with mock auth:

```typescript
import { createMockAuthState, createMockAuthBus, createMockAuthAPI } from '@mfe/auth-contract/testing';

const mockState = createMockAuthState({ roles: ['admin'], permissions: ['my:perm'] });
window.__MFE_AUTH_BUS__ = createMockAuthBus(mockState);
window.__MFE_AUTH_API__ = createMockAuthAPI(mockState);
```

## Design Decisions & Tradeoffs

### Why AuthBus on `window`?
The bus is a framework-agnostic singleton. Any technology (React, Vue, vanilla JS) can subscribe to auth events. The `window.__MFE_AUTH_BUS__` pattern ensures a single source of truth even when multiple bundles are loaded.

### Why a State Machine?
Auth states have strict transition rules. A state machine prevents impossible states (e.g., jumping from UNINITIALIZED to AUTHENTICATED) and makes the auth lifecycle predictable and debuggable.

### Why `@module-federation/vite`?
The official Module Federation 2.0 Vite plugin from the MF team. It supports shared dependency deduplication, cross-bundler interop (webpack/rspack hosts can consume Vite remotes and vice versa), built-in TypeScript type generation, and dev-mode HMR for remotes.

## Design Comparison: This Approach vs. Industry Alternatives

### This platform's approach

A **monorepo with shared auth contracts** where the shell owns authentication and remotes consume state through a global event bus. Module Federation handles runtime composition. Auth state flows one-way from shell to remotes via a validated state machine.

**Benefits:**
- Single source of truth for auth — no token duplication or sync issues across MFEs
- Framework-agnostic bus means remotes could be React, Vue, or vanilla JS
- State machine prevents auth race conditions and impossible states
- Shared singleton dependencies (React, auth-contract) eliminate version conflicts
- Each remote runs independently with mock auth for fast development loops
- Type-safe contracts enforced at compile time across the entire monorepo

**Drawbacks:**
- The shell is a single point of failure — if it fails to load, no MFE gets auth
- Global `window` singletons require careful cleanup and can leak between tests
- Monorepo coupling: all packages must agree on shared dependency versions
- Custom bus adds conceptual overhead vs. using a standard state library
- Module Federation dev experience (HMR, error messages) is less polished than single-SPA or iframe approaches

### Industry alternatives

**Single-SPA** is the most established MFE framework. It provides a top-level router that mounts/unmounts framework-specific applications. Auth is typically shared via a utility module or importmap-based shared dependency. Single-SPA is more mature and battle-tested in production, with better tooling for mixed-framework setups. However, it requires its own lifecycle API (`bootstrap`, `mount`, `unmount`) and doesn't provide Module Federation's shared dependency deduplication out of the box.

**Module Federation with webpack** (the original approach) is production-proven at scale. Most Module Federation documentation and ecosystem tooling targets webpack. Choosing Vite trades webpack's maturity for faster dev builds but with a newer, less battle-tested plugin.

**Iframe-based isolation** (used by Shopify, Spotify) provides the strongest isolation — each MFE runs in its own browsing context. Auth is shared via `postMessage` or cookie-based SSO. This eliminates shared dependency version conflicts entirely but at the cost of performance (each iframe loads its own framework) and UX (cross-iframe communication is async and lossy).

**Native Federation / importmap-based** approaches (used by `@softarc/native-federation`) skip the bundler plugin entirely and use browser-native import maps to resolve shared dependencies at runtime. This is the lightest-weight approach but requires a CDN or import map service and has less tooling support.

**For most React/Vite teams starting a new MFE platform**, the Module Federation approach used here is the recommended path. It provides the best balance of runtime sharing, developer experience, and deploy independence. The auth bus pattern is non-standard but solves a real problem: MFEs need auth state but shouldn't own the auth lifecycle.

## Testing

All packages use Vitest with colocated test files. React components use `@testing-library/react` with `jsdom`.

```bash
npm test                    # Run all tests
npm run test:coverage       # Generate coverage report
```

## License

MIT
