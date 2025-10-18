import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

/**
 * Error Boundary component
 * Catches React errors and displays fallback UI
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    }
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught error:', error, errorInfo)
    this.setState({
      error,
      errorInfo
    })
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen bg-gradient-to-b from-cyber-dark to-cyber-darker flex items-center justify-center p-4">
          <div className="bg-red-500/10 border-2 border-red-500/30 rounded-xl p-8 max-w-2xl w-full">
            <div className="flex items-center space-x-3 mb-6">
              <AlertTriangle className="w-12 h-12 text-red-500" />
              <div>
                <h1 className="text-2xl font-bold text-red-400">Something Went Wrong</h1>
                <p className="text-gray-400">The application encountered an unexpected error</p>
              </div>
            </div>

            {this.state.error && (
              <div className="bg-gray-900 rounded-lg p-4 mb-6">
                <p className="text-sm font-mono text-red-300 mb-2">{this.state.error.toString()}</p>
                {this.state.errorInfo && (
                  <details className="text-xs text-gray-500">
                    <summary className="cursor-pointer hover:text-gray-400">Stack Trace</summary>
                    <pre className="mt-2 overflow-auto">{this.state.errorInfo.componentStack}</pre>
                  </details>
                )}
              </div>
            )}

            <div className="flex items-center space-x-4">
              <button
                onClick={this.handleReset}
                className="flex items-center space-x-2 px-4 py-2 bg-cyber-blue hover:bg-cyber-blue/80 rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Try Again</span>
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
