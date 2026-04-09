import type { FC } from 'react';
import { createMockAuthState } from '@mfe/auth-contract/testing';
import { createMockAuthBus, createMockAuthAPI } from '@mfe/auth-contract/testing';
import OrdersModule from './OrdersModule';

const mockState = createMockAuthState({
  name: 'Dev User',
  email: 'dev@example.com',
  roles: ['user', 'admin'],
  permissions: ['orders:read', 'orders:write'],
});

window.__MFE_AUTH_BUS__ = createMockAuthBus(mockState);
window.__MFE_AUTH_API__ = createMockAuthAPI(mockState);

export const App: FC = () => {
  return (
    <div style={{ padding: '16px' }}>
      <h2 style={{ color: '#666' }}>[Standalone Dev Mode]</h2>
      <OrdersModule />
    </div>
  );
};
