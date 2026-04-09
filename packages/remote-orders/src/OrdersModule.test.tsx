import { describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { createMockAuthState, createMockAuthBus, createMockAuthAPI } from '@mfe/auth-contract/testing';
import OrdersModule from './OrdersModule';

beforeEach(() => {
  delete window.__MFE_AUTH_BUS__;
  delete window.__MFE_AUTH_API__;
});

describe('OrdersModule', () => {
  it('renders with mock auth state', () => {
    const state = createMockAuthState({ permissions: ['orders:read', 'orders:write'] });
    window.__MFE_AUTH_BUS__ = createMockAuthBus(state);
    window.__MFE_AUTH_API__ = createMockAuthAPI(state);

    render(React.createElement(OrdersModule));
    expect(screen.getByText('Orders Dashboard')).toBeDefined();
  });

  it('displays user info from useMfeAuth', () => {
    const state = createMockAuthState({ name: 'Jane Doe', email: 'jane@test.com', permissions: ['orders:read'] });
    window.__MFE_AUTH_BUS__ = createMockAuthBus(state);
    window.__MFE_AUTH_API__ = createMockAuthAPI(state);

    render(React.createElement(OrdersModule));
    expect(screen.getByText(/Jane Doe/)).toBeDefined();
  });

  it('RequirePermission gates the create button', () => {
    const state = createMockAuthState({ permissions: ['orders:read'] });
    window.__MFE_AUTH_BUS__ = createMockAuthBus(state);
    window.__MFE_AUTH_API__ = createMockAuthAPI(state);

    render(React.createElement(OrdersModule));
    expect(screen.queryByText('Create Order')).toBeNull();
    expect(screen.getByText('You do not have permission to create orders.')).toBeDefined();
  });

  it('shows create button when user has orders:write', () => {
    const state = createMockAuthState({ permissions: ['orders:read', 'orders:write'] });
    window.__MFE_AUTH_BUS__ = createMockAuthBus(state);
    window.__MFE_AUTH_API__ = createMockAuthAPI(state);

    render(React.createElement(OrdersModule));
    expect(screen.getByText('Create Order')).toBeDefined();
  });
});
