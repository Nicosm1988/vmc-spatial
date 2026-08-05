import { act, cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useExperienceStore } from '../state/useExperienceStore'
import TransitionStatus from './TransitionStatus'

function resetExperience() {
  useExperienceStore.setState(useExperienceStore.getInitialState(), true)
}

function startFloor16Transition() {
  useExperienceStore.getState().goToFloor16()
  const transition = useExperienceStore.getState().transition
  if (transition === null) throw new Error('El recorrido cinematográfico no se inició')
  return transition
}

describe('TransitionStatus', () => {
  beforeEach(() => {
    localStorage.clear()
    resetExperience()
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it('permanece fuera del árbol cuando no hay transición', () => {
    render(<TransitionStatus />)
    expect(screen.queryByLabelText('Estado del recorrido cinematográfico')).not.toBeInTheDocument()
  })

  it('expone un único plano secuencia, destino, progreso y cancelación', async () => {
    const user = userEvent.setup()
    const transition = startFloor16Transition()
    const cancelTransition = vi.fn()

    useExperienceStore.setState({
      cancelTransition,
      transition: { ...transition, phase: 'flight', progress: 0.37 },
    })

    render(<TransitionStatus />)

    const panel = screen.getByLabelText('Estado del recorrido cinematográfico')
    expect(panel).toHaveAttribute('data-transition-style', 'continuous')
    expect(screen.getByText('Plano secuencia')).toBeVisible()
    expect(screen.getByText(/Hacia Fachada · Piso 16/)).toBeVisible()
    expect(screen.getByRole('progressbar')).toHaveValue(37)
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuetext', '37%')
    expect(screen.getByRole('status')).toHaveTextContent('Recorrido continuo')

    const cancel = screen.getByRole('button', { name: 'Salir' })
    expect(cancel).toHaveAttribute('aria-keyshortcuts', 'Escape')
    await user.click(cancel)
    expect(cancelTransition).toHaveBeenCalledOnce()
  })

  it('actualiza el avance sin presentar etapas visuales separadas', () => {
    const transition = startFloor16Transition()
    render(<TransitionStatus />)

    act(() => {
      useExperienceStore.setState({
        transition: { ...transition, phase: 'handoff', progress: 0.78, handedOff: true },
      })
    })

    expect(screen.getByRole('progressbar')).toHaveValue(78)
    expect(screen.queryByRole('list', { name: 'Etapas del recorrido' })).not.toBeInTheDocument()
  })
})
