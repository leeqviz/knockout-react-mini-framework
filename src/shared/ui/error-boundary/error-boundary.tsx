import { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  name?: string;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  public override state: ErrorBoundaryState = { hasError: false };

  public static getDerivedStateFromError = (): ErrorBoundaryState => {
    return { hasError: true };
  };

  public override componentDidCatch = (error: Error, info: ErrorInfo) => {
    console.error(
      `Error in component ${this.props.name || 'Unknown'}:`,
      error,
      info,
    );
  };

  public override render = () => {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      } else {
        return (
          <div
            style={{
              padding: '10px',
              border: '1px solid red',
              color: 'red',
              borderRadius: '4px',
            }}
          >
            ⚠️ Error in <b>{this.props.name}</b>.
            <button
              onClick={() => this.setState({ hasError: false })}
              style={{ marginLeft: '10px' }}
            >
              Try again
            </button>
          </div>
        );
      }
    }
    return this.props.children;
  };
}
