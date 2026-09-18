import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  documentId: string | null;
  onReset: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught rendering error:', error, errorInfo);
  }

  public componentDidUpdate(prevProps: Props) {
    if (prevProps.documentId !== this.props.documentId) {
      this.setState({ hasError: false, error: null });
    }
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          height: '100%', width: '100%', background: 'var(--canvas-bg)', color: 'var(--text-primary)',
          padding: '20px', textAlign: 'center'
        }}>
          <AlertTriangle size={64} color="var(--node-color-red)" style={{ marginBottom: '24px' }} />
          <h1 style={{ marginBottom: '16px', fontSize: '24px' }}>Unable to open this mind map</h1>
          <div style={{ 
            background: 'var(--panel-bg)', padding: '16px', borderRadius: '8px', 
            border: '1px solid var(--node-color-red)', marginBottom: '24px', maxWidth: '600px',
            wordBreak: 'break-all', fontFamily: 'monospace'
          }}>
            {this.state.error?.message || 'Unknown error occurred during rendering.'}
          </div>
          {this.props.documentId && (
            <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
              Document ID: {this.props.documentId}
            </p>
          )}
          <button
            onClick={this.props.onReset}
            style={{
              padding: '12px 24px', background: 'var(--accent)', color: 'white', border: 'none',
              borderRadius: '8px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold',
              display: 'flex', alignItems: 'center', gap: '8px'
            }}
          >
            <Home size={20} /> Back to Maps
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
