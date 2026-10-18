import { Component } from 'react'

// Last line of defence: if a component throws while rendering, show a
// readable message with a way forward instead of a blank white page. Error
// details go to the console for developers and are never shown to visitors.
export default class ErrorBoundary extends Component {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error) {
    console.error('Unhandled UI error:', error)
  }

  render() {
    if (!this.state.failed) return this.props.children
    return (
      <div role="alert" className="flex min-h-screen flex-col items-center justify-center gap-4 bg-wwm-bg px-6 text-center">
        <h1 className="text-xl font-bold uppercase tracking-wide text-wwm-navy">Something went wrong</h1>
        <p className="max-w-md text-sm text-wwm-neutral-600">
          This page could not be displayed. Reloading usually fixes it; if the problem continues, please try again later.
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="bg-wwm-gold px-4 py-2 text-sm font-semibold uppercase tracking-wide text-wwm-navy hover:bg-wwm-gold-light focus-visible:outline-2 focus-visible:outline-wwm-navy"
          >
            Reload page
          </button>
          <a href="/" className="border border-wwm-neutral-300 px-4 py-2 text-sm font-semibold uppercase tracking-wide text-wwm-navy hover:bg-wwm-neutral-100">
            Go to home page
          </a>
        </div>
      </div>
    )
  }
}
