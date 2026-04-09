import React from 'react';
import type { ReactNode, ErrorInfo } from 'react';

interface RemoteErrorBoundaryProps {
  remoteName: string;
  fallback?: ReactNode;
  onError?: (error: Error) => void;
  children?: ReactNode;
}

interface RemoteErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class RemoteErrorBoundary extends React.Component<
  RemoteErrorBoundaryProps,
  RemoteErrorBoundaryState
> {
  constructor(props: RemoteErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): RemoteErrorBoundaryState {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error(`[RemoteErrorBoundary:${this.props.remoteName}]`, error, info);
    this.props.onError?.(error);
  }

  private handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  override render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback != null) {
        return this.props.fallback;
      }
      return (
        <div role="alert">
          <h3>Failed to load remote: {this.props.remoteName}</h3>
          <p>{this.state.error?.message ?? 'Unknown error'}</p>
          <button onClick={this.handleRetry}>Retry</button>
        </div>
      );
    }
    return this.props.children;
  }
}
