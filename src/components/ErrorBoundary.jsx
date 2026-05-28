import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh', display: 'flex', alignItems: 'center',
          justifyContent: 'center', flexDirection: 'column', gap: 16,
          fontFamily: 'var(--font)', background: 'var(--bg)', padding: '2rem',
          textAlign: 'center',
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: 'var(--red-light)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            border: '2px solid rgba(192,57,43,.25)',
          }}>
            <svg viewBox="0 0 24 24" style={{ width: 26, height: 26, stroke: 'var(--red)', fill: 'none', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }}>
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>Something went wrong</div>
          <div style={{ fontSize: 13, color: 'var(--text-2)', maxWidth: 400, lineHeight: 1.6 }}>
            An unexpected error occurred. Please refresh the page or contact support if the issue persists.
          </div>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 24px', borderRadius: 'var(--radius)', border: 'none',
              background: 'var(--blue)', color: '#fff', fontSize: 13, fontWeight: 600,
              cursor: 'pointer', marginTop: 8,
            }}
          >
            Reload Page
          </button>
          {import.meta.env.DEV && (
            <pre style={{
              marginTop: 16, padding: '1rem', background: 'var(--surface)',
              border: '1px solid var(--border)', borderRadius: 'var(--radius)',
              fontSize: 11, color: 'var(--red)', textAlign: 'left',
              maxWidth: 600, overflow: 'auto',
            }}>
              {this.state.error?.toString()}
            </pre>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}
