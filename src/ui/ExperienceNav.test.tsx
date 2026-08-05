import { act, cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useExperienceStore } from '../state/useExperienceStore'
import ExperienceNav from './ExperienceNav'

function resetExperience() {
  useExperienceStore.setState(useExperienceStore.getInitialState(), true)
}

describe('ExperienceNav', () => {
  beforeEach(() => {
    localStorage.clear()
    resetExperience()
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it('mantiene el paso activo accesible y lo usa para reencuadrar', async () => {
    const user = userEvent.setup()
    const ensure3D = vi.fn()
    const reframe = vi.fn()
    render(<ExperienceNav ensure3D={ensure3D} reframe={reframe} />)

    const exterior = screen.getByRole('button', { name: 'Volver a la torre completa' })
    const floor16 = screen.getByRole('button', { name: 'Ir al piso 16' })

    expect(screen.getByTestId('scene-stage')).toHaveTextContent('Exterior · Puerto Madero')
    expect(exterior).toHaveAttribute('aria-current', 'step')
    expect(floor16).not.toBeDisabled()

    await user.click(exterior)
    expect(ensure3D).toHaveBeenCalledTimes(1)
    expect(reframe).toHaveBeenCalledWith('exterior')
    expect(useExperienceStore.getState().transition).toBeNull()

    await user.click(floor16)
    const transitionId = useExperienceStore.getState().transition?.id

    expect(ensure3D).toHaveBeenCalledTimes(2)
    expect(useExperienceStore.getState()).toMatchObject({
      stage: 'exterior',
      transition: { to: 'floor16', phase: 'flight' },
    })
    expect(screen.getByLabelText('Recorrido 3D')).toHaveClass('experience-nav--compact')
    expect(screen.getByRole('button', { name: 'Ir al piso 16' })).toBeDisabled()
    expect(ensure3D).toHaveBeenCalledTimes(2)
    expect(useExperienceStore.getState().transition?.id).toBe(transitionId)
  })

  it('despacha cada destino desde una etapa estable', async () => {
    const user = userEvent.setup()
    const ensure3D = vi.fn()
    render(<ExperienceNav ensure3D={ensure3D} reframe={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: 'Ir al piso 16' }))
    expect(useExperienceStore.getState().transition?.to).toBe('floor16')

    act(() => {
      useExperienceStore.setState({ stage: 'floor16', transition: null })
    })

    await user.click(screen.getByRole('button', { name: 'Entrar a la sala' }))
    expect(useExperienceStore.getState().transition?.to).toBe('interior')

    act(() => {
      useExperienceStore.setState({ stage: 'interior', activeScene: 'interior', transition: null })
    })

    await user.click(screen.getByRole('button', { name: 'Volver a la torre completa' }))
    expect(useExperienceStore.getState().transition?.to).toBe('exterior')
    expect(ensure3D).toHaveBeenCalledTimes(3)
  })
})
