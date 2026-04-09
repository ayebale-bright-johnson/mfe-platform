import type { FC } from 'react';
import { createMockAuthState, createMockAuthBus, createMockAuthAPI } from '@mfe/auth-contract/testing';
import SettingsModule from './SettingsModule';

const mockState = createMockAuthState({
  name: 'Dev Admin',
  email: 'admin@example.com',
  roles: ['user', 'admin'],
  permissions: ['settings:read', 'settings:write', 'users:manage'],
  tenantId: 'tenant-001',
});

window.__MFE_AUTH_BUS__ = createMockAuthBus(mockState);
window.__MFE_AUTH_API__ = createMockAuthAPI(mockState);

export const App: FC = () => {
  return (
    <div style={{ padding: '16px' }}>
      <h2 style={{ color: '#666' }}>[Standalone Dev Mode]</h2>
      <SettingsModule />
    </div>
  );
};
