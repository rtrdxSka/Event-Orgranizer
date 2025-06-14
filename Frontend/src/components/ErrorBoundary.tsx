import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error boundary caught an error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-purple-950 flex items-center justify-center">
          <div className="max-w-md mx-auto p-6 bg-purple-900/40 rounded-xl border border-purple-700/50 text-center">
            <AlertTriangle className="h-16 w-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-purple-100 mb-2">
              Something went wrong
            </h2>
            <p className="text-purple-200 mb-6">
              An unexpected error occurred. Please try refreshing the page.
            </p>
            <Button
              onClick={() => window.location.reload()}
              className="bg-purple-200 text-purple-950 hover:bg-purple-100"
            >
              Refresh Page
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;