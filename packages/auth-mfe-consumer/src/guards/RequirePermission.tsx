import type { FC, ReactNode } from 'react';
import { useMfeAuth } from '../useMfeAuth';

interface RequirePermissionProps {
  permission: string | string[];
  mode?: 'all' | 'any';
  fallback?: ReactNode;
  children?: ReactNode;
}

export const RequirePermission: FC<RequirePermissionProps> = ({
  permission,
  mode = 'all',
  fallback,
  children,
}) => {
  const auth = useMfeAuth();
  const permissions = Array.isArray(permission) ? permission : [permission];

  const hasAccess = mode === 'any'
    ? auth.hasAnyPermission(permissions)
    : auth.hasAllPermissions(permissions);

  if (!hasAccess) {
    return <>{fallback ?? <div>Insufficient permissions</div>}</>;
  }

  return <>{children}</>;
};
