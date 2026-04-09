import { describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { createMockAuthState, createMockAuthBus, createMockAuthAPI } from '@mfe/auth-contract/testing';
import SettingsModule from './SettingsModule';

beforeEach(() => {
  delete window.__MFE_AUTH_BUS__;
  delete window.__MFE_AUTH_API__;
});

describe('SettingsModule', () => {
  it('renders with mock auth state', () => {
    const state = createMockAuthState({ roles: ['admin'] });
    window.__MFE_AUTH_BUS__ = createMockAuthBus(state);
    window.__MFE_AUTH_API__ = createMockAuthAPI(state);

    render(React.createElement(SettingsModule));
    expect(screen.getByText('Settings')).toBeDefined();
  });

  it('displays user profile info', () => {
    const state = createMockAuthState({ name: 'Admin User', email: 'admin@test.com', roles: ['admin'] });
    window.__MFE_AUTH_BUS__ = createMockAuthBus(state);
    window.__MFE_AUTH_API__ = createMockAuthAPI(state);

    render(React.createElement(SettingsModule));
    expect(screen.getByText('Admin User')).toBeDefined();
    expect(screen.getByText('admin@test.com')).toBeDefined();
  });

  it('displays permissions list', () => {
    const state = createMockAuthState({ permissions: ['settings:read', 'settings:write'], roles: ['admin'] });
    window.__MFE_AUTH_BUS__ = createMockAuthBus(state);
    window.__MFE_AUTH_API__ = createMockAuthAPI(state);

    render(React.createElement(SettingsModule));
    expect(screen.getByText('settings:read')).toBeDefined();
    expect(screen.getByText('settings:write')).toBeDefined();
  });

  it('RequireRole admin gates the manage users section', () => {
    const state = createMockAuthState({ roles: ['user'] });
    window.__MFE_AUTH_BUS__ = createMockAuthBus(state);
    window.__MFE_AUTH_API__ = createMockAuthAPI(state);

    render(React.createElement(SettingsModule));
    expect(screen.queryByText('Manage Users')).toBeNull();
    expect(screen.getByText('Admin access required to manage users.')).toBeDefined();
  });

  it('shows manage users when admin role present', () => {
    const state = createMockAuthState({ roles: ['admin'] });
    window.__MFE_AUTH_BUS__ = createMockAuthBus(state);
    window.__MFE_AUTH_API__ = createMockAuthAPI(state);

    render(React.createElement(SettingsModule));
    expect(screen.getByText('Manage Users')).toBeDefined();
  });
});
