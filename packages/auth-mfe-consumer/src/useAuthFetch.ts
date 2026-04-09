import { useMemo } from 'react';
import { createAuthFetch } from '@mfe/auth-contract';
import { useMfeAuth } from './useMfeAuth';

export function useAuthFetch(): typeof fetch {
  const auth = useMfeAuth();
  return useMemo(() => createAuthFetch(auth), [auth]);
}
