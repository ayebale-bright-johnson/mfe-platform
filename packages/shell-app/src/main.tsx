import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { ShellAuthProvider } from '@mfe/auth-shell-provider';
import { authConfig } from './auth-config';
import { routes } from './routes';

const router = createBrowserRouter(routes);

const root = document.getElementById('root');
if (!root) throw new Error('Root element not found');

createRoot(root).render(
  <StrictMode>
    <ShellAuthProvider config={authConfig}>
      <RouterProvider router={router} />
    </ShellAuthProvider>
  </StrictMode>,
);
