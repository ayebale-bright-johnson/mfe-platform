import { useState, useEffect } from 'react';
import type { FC } from 'react';
import type { AuthEvent } from '@mfe/auth-contract';
import { getAuthBus } from '@mfe/auth-contract';

export const AuthDebugPanel: FC = () => {
  const [events, setEvents] = useState<AuthEvent[]>([]);
  const bus = getAuthBus();
  const state = bus.getState();

  useEffect(() => {
    const unsub = bus.subscribe((event: AuthEvent) => {
      setEvents((prev) => [...prev.slice(-49), event]);
    });
    return unsub;
  }, [bus]);

  const tokenExpiry = state.status === 'AUTHENTICATED' || state.status === 'TOKEN_REFRESHING'
    ? Math.max(0, Math.floor((state.tokens.expiresAt - Date.now()) / 1000))
    : null;

  return (
    <div
      style={{
        position: 'fixed', bottom: 0, right: 0, width: '350px',
        maxHeight: '300px', overflow: 'auto', background: '#1a1a2e',
        color: '#eee', padding: '12px', fontSize: '12px', fontFamily: 'monospace',
        borderTopLeftRadius: '8px', zIndex: 9999,
      }}
    >
      <h4 style={{ margin: '0 0 8px' }}>Auth Debug</h4>
      <div>Status: <strong>{state.status}</strong></div>
      {tokenExpiry !== null && <div>Token expires in: {tokenExpiry}s</div>}
      <h5 style={{ margin: '8px 0 4px' }}>Events ({events.length})</h5>
      <div>
        {events.map((e, i) => (
          <div key={i} style={{ borderTop: '1px solid #333', padding: '2px 0' }}>
            {`[${new Date(e.timestamp).toLocaleTimeString()}] ${e.type}`}
          </div>
        ))}
      </div>
    </div>
  );
};
