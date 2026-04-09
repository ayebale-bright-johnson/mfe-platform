import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  'packages/auth-contract',
  'packages/federation-config',
  'packages/auth-shell-provider',
  'packages/auth-mfe-consumer',
  'packages/shell-app',
  'packages/remote-orders',
  'packages/remote-settings',
]);
