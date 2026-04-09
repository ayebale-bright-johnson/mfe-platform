import { useEffect } from 'react';
import type { FC, ReactNode } from 'react';
import { useMfeAuth } from '../useMfeAuth';

interface RequireAuthProps {
  children?: ReactNode;
  loadingFallback?: ReactNode;
  errorFallback?: ReactNode;
  autoLogin?: boolean;
}

export const RequireAuth: FC<RequireAuthProps> = ({
  children,
  loadingFallback,
  errorFallback,
  autoLogin = true,
}) => {
  const auth = useMfeAuth();

  useEffect(() => {
    if (autoLogin && (auth.state.status === 'SESSION_EXPIRED' || auth.state.status === 'LOGGED_OUT')) {
      void auth.login();
    }
  }, [auth.state.status, autoLogin, auth]);

  switch (auth.state.status) {
    case 'AUTHENTICATED':
      return <>{children}</>;
    case 'UNINITIALIZED':
    case 'AUTHENTICATING':
    case 'TOKEN_REFRESHING':
      return <>{loadingFallback ?? <div>Loading authentication...</div>}</>;
    case 'ERROR':
      return (
        <>
          {errorFallback ?? (
            <div role="alert">
              <p>Authentication error: {auth.state.error.message}</p>
              <button onClick={() => { void auth.login(); }}>Retry</button>
            </div>
          )}
        </>
      );
    case 'SESSION_EXPIRED':
    case 'LOGGED_OUT':
      return <div>Redirecting to login...</div>;
  }
};
