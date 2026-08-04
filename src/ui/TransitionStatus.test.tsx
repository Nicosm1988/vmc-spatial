import { act, cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CINEMATIC_PHASE_LABELS } from '../domain/cinematicAccess'
import { useExperienceStore } from '../state/useExperienceStore'
import CinematicHandoff from './CinematicHandoff'
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

  it('expone fase, destino, progreso real y cancelación por teclado', async () => {
    const user = userEvent.setup()
    const transition = startFloor16Transition()
    const cancelTransition = vi.fn()

    useExperienceStore.setState({
      cancelTransition,
      transition: { ...transition, phase: 'flight', progress: 0.37 },
    })

    render(<TransitionStatus />)

    expect(screen.getByText('DEMO / NO VERIFICADO')).toBeVisible()
    expect(screen.getAllByText(CINEMATIC_PHASE_LABELS.flight)[0]).toBeVisible()
    expect(screen.getByText(/Destino · Fachada · Piso 16/)).toBeVisible()
    expect(screen.getByRole('progressbar')).toHaveValue(37)
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuetext', '37%')
    expect(screen.getByRole('status')).toHaveTextContent(CINEMATIC_PHASE_LABELS.flight)

    const cancel = screen.getByRole('button', { name: 'Cancelar recorrido' })
    expect(cancel).toHaveAttribute('aria-keyshortcuts', 'Escape')
    await user.click(cancel)
    expect(cancelTransition).toHaveBeenCalledOnce()
  })

  it('actualiza el anuncio al cambiar de fase sin convertir el overlay en modal', () => {
    const transition = startFloor16Transition()
    render(<TransitionStatus />)

    const panel = screen.getByLabelText('Estado del recorrido cinematográfico')
    expect(panel).not.toHaveAttribute('role', 'dialog')

    act(() => {
      useExperienceStore.setState({
        transition: { ...transition, phase: 'handoff', progress: 0.78, handedOff: true },
      })
    })

    expect(panel).toHaveAttribute('data-phase', 'handoff')
    expect(screen.getByRole('status')).toHaveTextContent(CINEMATIC_PHASE_LABELS.handoff)
    expect(screen.getByRole('progressbar')).toHaveValue(78)
  })
})

describe('CinematicHandoff', () => {
  beforeEach(() => {
    localStorage.clear()
    resetExperience()
  })

  afterEach(() => {
    cleanup()
  })

  it('cubre el cambio de escena únicamente durante cover, handoff y reveal', () => {
    const transition = startFloor16Transition()
    render(<CinematicHandoff />)

    expect(screen.queryByTestId('cinematic-handoff')).not.toBeInTheDocument()

    for (const phase of ['cover', 'handoff', 'reveal'] as const) {
      act(() => {
        useExperienceStore.setState({ transition: { ...transition, phase }, reducedMotion: true })
      })

      expect(screen.getByTestId('cinematic-handoff')).toHaveAttribute('data-phase', phase)
      expect(screen.getByTestId('cinematic-handoff')).toHaveClass(
        `cinematic-handoff--${phase}`,
        'cinematic-handoff--reduced-motion',
      )
    }

    act(() => {
      useExperienceStore.setState({ transition: null })
    })
    expect(screen.queryByTestId('cinematic-handoff')).not.toBeInTheDocument()
  })
})
