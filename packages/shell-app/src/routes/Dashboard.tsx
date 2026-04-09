import type { FC } from 'react';
import { useMfeAuth } from '@mfe/auth-mfe-consumer';

export const Dashboard: FC = () => {
  const { state } = useMfeAuth();

  return (
    <div>
      <h1>Dashboard</h1>
      <div>
        <h3>Auth State</h3>
        <pre>{JSON.stringify(state, null, 2)}</pre>
      </div>
      {state.status === 'AUTHENTICATED' && (
        <div>
          <h3>Welcome, {state.user.name}</h3>
          <p>Email: {state.user.email}</p>
          <p>Roles: {state.user.roles.join(', ')}</p>
          <p>Permissions: {state.user.permissions.join(', ')}</p>
        </div>
      )}
    </div>
  );
};
