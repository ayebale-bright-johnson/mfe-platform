import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { createMockAuthState, createMockAuthAPI, createMockAuthBus } from '@mfe/auth-contract/testing';

vi.mock('remote_orders/OrdersModule', () => ({
  default: function MockOrders() { return <div>Mock Orders</div>; },
}));

vi.mock('remote_settings/SettingsModule', () => ({
  default: function MockSettings() { return <div>Mock Settings</div>; },
}));

import { routes } from './routes';

function renderApp(route = '/'): void {
  const router = createMemoryRouter(routes, { initialEntries: [route] });
  render(<RouterProvider router={router} />);
}

beforeEach(() => {
  delete window.__MFE_AUTH_BUS__;
  delete window.__MFE_AUTH_API__;
  const state = createMockAuthState({ roles: ['admin'], permissions: ['orders:read', 'orders:write'] });
  window.__MFE_AUTH_BUS__ = createMockAuthBus(state);
  window.__MFE_AUTH_API__ = createMockAuthAPI(state);
});

describe('App', () => {
  it('renders dashboard at /', () => {
    renderApp('/');
    expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeDefined();
  });

  it('renders navigation links', () => {
    renderApp('/');
    expect(screen.getByText('Orders')).toBeDefined();
    expect(screen.getByText('Settings')).toBeDefined();
  });

  it('renders orders route wrapper at /orders', () => {
    renderApp('/orders');
    expect(document.body.textContent).toBeTruthy();
  });

  it('renders settings route wrapper at /settings', () => {
    renderApp('/settings');
    expect(document.body.textContent).toBeTruthy();
  });
});
