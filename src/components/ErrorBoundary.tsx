import React from 'react';

interface State {
  hasError: boolean;
}

/**
 * App-wide error boundary (fix B10). Catches render-time exceptions so a single
 * broken component shows a friendly recovery screen instead of a blank page.
 */
export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, info: unknown) {
    // Log for debugging; no external reporting to avoid extra network calls.
    console.error('Unhandled UI error:', error, info);
  }

  private handleReload = () => {
    this.setState({ hasError: false });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-comun-black flex items-center justify-center px-6 text-center">
          <div className="max-w-md">
            <h1 className="font-serif-display text-3xl text-comun-gold mb-3">Something went wrong</h1>
            <p className="font-sans text-sm text-comun-muted mb-6">
              An unexpected error occurred. Reloading the page usually fixes it.
            </p>
            <button
              onClick={this.handleReload}
              className="btn-primary text-sm px-7 py-3"
            >
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
