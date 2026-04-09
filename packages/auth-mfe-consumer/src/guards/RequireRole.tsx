import type { FC, ReactNode } from 'react';
import { useMfeAuth } from '../useMfeAuth';

interface RequireRoleProps {
  role: string | string[];
  mode?: 'all' | 'any';
  fallback?: ReactNode;
  children?: ReactNode;
}

export const RequireRole: FC<RequireRoleProps> = ({
  role,
  mode = 'all',
  fallback,
  children,
}) => {
  const { state } = useMfeAuth();

  if (state.status !== 'AUTHENTICATED') {
    return <>{fallback ?? <div>Not authenticated</div>}</>;
  }

  const roles = Array.isArray(role) ? role : [role];
  const hasAccess = mode === 'any'
    ? roles.some((r) => state.user.roles.includes(r))
    : roles.every((r) => state.user.roles.includes(r));

  if (!hasAccess) {
    return <>{fallback ?? <div>Insufficient role</div>}</>;
  }

  return <>{children}</>;
};
