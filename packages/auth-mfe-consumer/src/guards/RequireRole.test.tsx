import { describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { createMockAuthState, createMockAuthAPI, createMockAuthBus } from '@mfe/auth-contract/testing';
import { RequireRole } from './RequireRole';

beforeEach(() => {
  delete window.__MFE_AUTH_BUS__;
  delete window.__MFE_AUTH_API__;
  const state = createMockAuthState({ roles: ['user', 'admin'] });
  window.__MFE_AUTH_BUS__ = createMockAuthBus(state);
  window.__MFE_AUTH_API__ = createMockAuthAPI(state);
});

describe('RequireRole', () => {
  it('renders children when user has required role', () => {
    render(
      React.createElement(RequireRole, { role: 'admin' },
        React.createElement('div', null, 'Admin content'),
      ),
    );
    expect(screen.getByText('Admin content')).toBeDefined();
  });

  it('renders fallback when user lacks role', () => {
    render(
      React.createElement(RequireRole, { role: 'superadmin', fallback: React.createElement('div', null, 'No role') },
        React.createElement('div', null, 'Protected'),
      ),
    );
    expect(screen.getByText('No role')).toBeDefined();
  });

  it('mode any passes with at least one role', () => {
    render(
      React.createElement(RequireRole, { role: ['admin', 'superadmin'], mode: 'any' },
        React.createElement('div', null, 'Partial role match'),
      ),
    );
    expect(screen.getByText('Partial role match')).toBeDefined();
  });

  it('mode all fails when missing any role', () => {
    render(
      React.createElement(RequireRole, { role: ['admin', 'superadmin'], mode: 'all' },
        React.createElement('div', null, 'All roles'),
      ),
    );
    expect(screen.queryByText('All roles')).toBeNull();
  });
});
