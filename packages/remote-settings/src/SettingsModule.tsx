import type { FC } from 'react';
import { useMfeAuth, RequireRole } from '@mfe/auth-mfe-consumer';

const MOCK_USERS = [
  { id: '1', name: 'Alice Johnson', email: 'alice@example.com', role: 'admin' },
  { id: '2', name: 'Bob Smith', email: 'bob@example.com', role: 'user' },
  { id: '3', name: 'Carol Williams', email: 'carol@example.com', role: 'user' },
];

const thStyle = { textAlign: 'left' as const, padding: '8px', borderBottom: '2px solid #ccc' };
const tdStyle = { padding: '8px', borderBottom: '1px solid #eee' };

const SettingsModule: FC = () => {
  const { state } = useMfeAuth();

  return (
    <div>
      <h1>Settings</h1>

      {state.status === 'AUTHENTICATED' && (
        <div>
          <h2>User Profile</h2>
          <div style={{ background: '#f5f5f5', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
            <p><strong>Name: </strong>{state.user.name}</p>
            <p><strong>Email: </strong>{state.user.email}</p>
            <p><strong>Tenant: </strong>{state.user.tenantId ?? 'N/A'}</p>
          </div>

          <h2>Permissions</h2>
          <ul>
            {state.user.permissions.map((perm) => (
              <li key={perm}>{perm}</li>
            ))}
          </ul>

          <h2>Roles</h2>
          <ul>
            {state.user.roles.map((role) => (
              <li key={role}>{role}</li>
            ))}
          </ul>
        </div>
      )}

      <RequireRole
        role="admin"
        fallback={<p style={{ color: '#999' }}>Admin access required to manage users.</p>}
      >
        <div style={{ marginTop: '24px' }}>
          <h2>Manage Users</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thStyle}>Name</th>
                <th style={thStyle}>Email</th>
                <th style={thStyle}>Role</th>
                <th style={thStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_USERS.map((user) => (
                <tr key={user.id}>
                  <td style={tdStyle}>{user.name}</td>
                  <td style={tdStyle}>{user.email}</td>
                  <td style={tdStyle}>{user.role}</td>
                  <td style={tdStyle}>
                    <button
                      style={{ padding: '4px 8px', cursor: 'pointer' }}
                      onClick={() => { alert(`Edit user: ${user.name}`); }}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </RequireRole>
    </div>
  );
};

export default SettingsModule;
