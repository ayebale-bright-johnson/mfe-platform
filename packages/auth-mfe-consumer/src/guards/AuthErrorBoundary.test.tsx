import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { AuthErrorBoundary } from './AuthErrorBoundary';

function ThrowingChild({ shouldThrow }: { shouldThrow: boolean }): React.JSX.Element {
  if (shouldThrow) throw new Error('Auth error occurred');
  return React.createElement('div', null, 'Safe content');
}

describe('AuthErrorBoundary', () => {
  it('renders children when no error', () => {
    render(
      React.createElement(AuthErrorBoundary, null,
        React.createElement(ThrowingChild, { shouldThrow: false }),
      ),
    );
    expect(screen.getByText('Safe content')).toBeDefined();
  });

  it('catches errors and renders recovery UI', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      React.createElement(AuthErrorBoundary, null,
        React.createElement(ThrowingChild, { shouldThrow: true }),
      ),
    );
    expect(screen.getByRole('alert')).toBeDefined();
    expect(screen.getByText('Try Again')).toBeDefined();
    spy.mockRestore();
  });

  it('retry resets the boundary', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    let shouldThrow = true;

    function Conditional(): React.JSX.Element {
      if (shouldThrow) throw new Error('fail');
      return React.createElement('div', null, 'Recovered');
    }

    render(
      React.createElement(AuthErrorBoundary, null,
        React.createElement(Conditional),
      ),
    );

    shouldThrow = false;
    fireEvent.click(screen.getByText('Try Again'));
    expect(screen.getByText('Recovered')).toBeDefined();
    spy.mockRestore();
  });

  it('calls onRetry when provided', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const onRetry = vi.fn();

    render(
      React.createElement(AuthErrorBoundary, { onRetry },
        React.createElement(ThrowingChild, { shouldThrow: true }),
      ),
    );

    fireEvent.click(screen.getByText('Try Again'));
    expect(onRetry).toHaveBeenCalledTimes(1);
    spy.mockRestore();
  });
});
