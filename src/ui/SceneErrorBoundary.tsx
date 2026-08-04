import { Component, type ErrorInfo, type ReactNode } from 'react'
import WebGLFallback from './WebGLFallback'

interface Props {
  children: ReactNode
  openPlan: () => void
}

interface State {
  failed: boolean
}

export default class SceneErrorBoundary extends Component<Props, State> {
  state: State = { failed: false }

  static getDerivedStateFromError(): State {
    return { failed: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('No se pudo iniciar la escena 3D.', error, info.componentStack)
  }

  render() {
    if (this.state.failed) return <WebGLFallback openPlan={this.props.openPlan} />
    return this.props.children
  }
}
