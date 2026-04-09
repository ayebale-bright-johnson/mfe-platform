import type { FC } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { AuthDebugPanel } from './components/AuthDebugPanel';

export const Layout: FC = () => (
  <div style={{ display: 'flex', minHeight: '100vh' }}>
    <nav style={{ width: '200px', padding: '16px', borderRight: '1px solid #ccc' }}>
      <h2>MFE Shell</h2>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        <li><Link to="/">Dashboard</Link></li>
        <li><Link to="/orders">Orders</Link></li>
        <li><Link to="/settings">Settings</Link></li>
      </ul>
    </nav>
    <main style={{ flex: 1, padding: '16px' }}>
      <Outlet />
    </main>
    {import.meta.env.DEV && <AuthDebugPanel />}
  </div>
);
