import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

import { RemoteErrorBoundary } from './RemoteErrorBoundary';

function ThrowingChild({ shouldThrow }: { shouldThrow: boolean }): React.JSX.Element {
  if (shouldThrow) {
    throw new Error('Chunk load failed');
  }
  return React.createElement('div', null, 'Remote content loaded');
}

describe('RemoteErrorBoundary', () => {
  it('renders children when no error occurs', () => {
    render(
      React.createElement(RemoteErrorBoundary, { remoteName: 'test' },
        React.createElement(ThrowingChild, { shouldThrow: false }),
      ),
    );
    expect(screen.getByText('Remote content loaded')).toBeDefined();
  });

  it('catches errors and renders fallback UI', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      React.createElement(RemoteErrorBoundary, { remoteName: 'orders' },
        React.createElement(ThrowingChild, { shouldThrow: true }),
      ),
    );
    expect(screen.getByRole('alert')).toBeDefined();
    expect(screen.getByText(/Failed to load remote: orders/)).toBeDefined();
    spy.mockRestore();
  });

  it('retry button resets the error boundary', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    let shouldThrow = true;

    function ConditionalChild(): React.JSX.Element {
      if (shouldThrow) throw new Error('fail');
      return React.createElement('div', null, 'Recovered');
    }

    render(
      React.createElement(RemoteErrorBoundary, { remoteName: 'test' },
        React.createElement(ConditionalChild),
      ),
    );

    expect(screen.getByRole('alert')).toBeDefined();

    shouldThrow = false;
    fireEvent.click(screen.getByText('Retry'));

    expect(screen.getByText('Recovered')).toBeDefined();
    spy.mockRestore();
  });

  it('onError callback is invoked with the error', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const onError = vi.fn();
    render(
      React.createElement(RemoteErrorBoundary, { remoteName: 'test', onError },
        React.createElement(ThrowingChild, { shouldThrow: true }),
      ),
    );
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError.mock.calls[0]?.[0]).toBeInstanceOf(Error);
    spy.mockRestore();
  });
});
