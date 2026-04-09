import { useEffect, useState } from 'react';
import type { FC } from 'react';
import { UserManager } from 'oidc-client-ts';
import { type MfeOidcConfig, createOidcConfig } from './oidc-config';

interface OidcCallbackProps {
  config: MfeOidcConfig;
  onSuccess?: (returnUrl: string) => void;
  onError?: (error: Error) => void;
}

export const OidcCallback: FC<OidcCallbackProps> = ({ config, onSuccess, onError }) => {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const um = new UserManager(createOidcConfig(config));
    um.signinRedirectCallback()
      .then((user) => {
        const returnUrl = (user.state as { returnUrl?: string } | undefined)?.returnUrl ?? '/';
        onSuccess?.(returnUrl);
        if (!onSuccess) {
          window.location.replace(returnUrl);
        }
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : 'Callback processing failed';
        setError(message);
        onError?.(err instanceof Error ? err : new Error(message));
      });
  }, [config, onSuccess, onError]);

  if (error !== null) {
    return (
      <div role="alert">
        <h2>Authentication Error</h2>
        <p>{error}</p>
        <button onClick={() => { window.location.replace('/'); }}>Return Home</button>
      </div>
    );
  }

  return (
    <div>
      <p>Processing authentication...</p>
    </div>
  );
};
