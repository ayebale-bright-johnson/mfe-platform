import { Suspense, lazy } from 'react';
import type { RouteObject } from 'react-router-dom';
import { OidcCallback } from '@mfe/auth-shell-provider';
import { RequireAuth, RequirePermission, RequireRole } from '@mfe/auth-mfe-consumer';
import { RemoteErrorBoundary } from '@mfe/federation-config/runtime';
import { Layout } from './Layout';
import { Dashboard } from './routes/Dashboard';
import { authConfig } from './auth-config';

const RemoteOrders = lazy(() => import('remote_orders/OrdersModule'));
const RemoteSettings = lazy(() => import('remote_settings/SettingsModule'));

export const routes: RouteObject[] = [
  {
    element: <Layout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'callback', element: <OidcCallback config={authConfig} /> },
      {
        path: 'orders',
        element: (
          <RequireAuth>
            <RequirePermission permission="orders:read">
              <RemoteErrorBoundary remoteName="remote_orders">
                <Suspense fallback={<div>Loading Orders...</div>}>
                  <RemoteOrders />
                </Suspense>
              </RemoteErrorBoundary>
            </RequirePermission>
          </RequireAuth>
        ),
      },
      {
        path: 'settings',
        element: (
          <RequireAuth>
            <RequireRole role="admin">
              <RemoteErrorBoundary remoteName="remote_settings">
                <Suspense fallback={<div>Loading Settings...</div>}>
                  <RemoteSettings />
                </Suspense>
              </RemoteErrorBoundary>
            </RequireRole>
          </RequireAuth>
        ),
      },
    ],
  },
];
