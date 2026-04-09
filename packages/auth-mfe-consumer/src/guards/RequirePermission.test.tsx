import { describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { createMockAuthState, createMockAuthAPI, createMockAuthBus } from '@mfe/auth-contract/testing';
import { RequirePermission } from './RequirePermission';

beforeEach(() => {
  delete window.__MFE_AUTH_BUS__;
  delete window.__MFE_AUTH_API__;
  const state = createMockAuthState({ permissions: ['orders:read', 'orders:write'] });
  window.__MFE_AUTH_BUS__ = createMockAuthBus(state);
  window.__MFE_AUTH_API__ = createMockAuthAPI(state);
});

describe('RequirePermission', () => {
  it('renders children when user has required permission', () => {
    render(
      React.createElement(RequirePermission, { permission: 'orders:read' },
        React.createElement('div', null, 'Orders visible'),
      ),
    );
    expect(screen.getByText('Orders visible')).toBeDefined();
  });

  it('renders fallback when user lacks permission', () => {
    render(
      React.createElement(RequirePermission, { permission: 'admin:delete', fallback: React.createElement('div', null, 'No access') },
        React.createElement('div', null, 'Protected'),
      ),
    );
    expect(screen.getByText('No access')).toBeDefined();
  });

  it('mode any passes when user has at least one permission', () => {
    render(
      React.createElement(RequirePermission, { permission: ['orders:read', 'admin:delete'], mode: 'any' },
        React.createElement('div', null, 'Partial match'),
      ),
    );
    expect(screen.getByText('Partial match')).toBeDefined();
  });

  it('mode all fails when user is missing any permission', () => {
    render(
      React.createElement(RequirePermission, { permission: ['orders:read', 'admin:delete'], mode: 'all' },
        React.createElement('div', null, 'All match'),
      ),
    );
    expect(screen.queryByText('All match')).toBeNull();
  });
});
