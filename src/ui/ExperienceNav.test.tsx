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

  it('mantiene el paso activo accesible y no reinicia el mismo recorrido', async () => {
    const user = userEvent.setup()
    const ensure3D = vi.fn()
    render(<ExperienceNav ensure3D={ensure3D} />)

    const exterior = screen.getByRole('button', { name: 'Exterior' })
    const floor16 = screen.getByRole('button', { name: 'Ir al piso 16' })

    expect(screen.getByTestId('scene-stage')).toHaveTextContent('Exterior · Puerto Madero')
    expect(exterior).toHaveAttribute('aria-current', 'step')
    expect(floor16).not.toBeDisabled()

    await user.click(exterior)
    expect(ensure3D).toHaveBeenCalledTimes(1)
    expect(useExperienceStore.getState().transition).toBeNull()

    await user.click(floor16)
    const transitionId = useExperienceStore.getState().transition?.id

    expect(ensure3D).toHaveBeenCalledTimes(2)
    expect(useExperienceStore.getState()).toMatchObject({
      stage: 'exterior',
      transition: { to: 'floor16', phase: 'flight' },
    })
    expect(screen.getByLabelText('Recorrido 3D')).toHaveClass('experience-nav--compact')
    expect(screen.queryByRole('button', { name: 'Ir al piso 16' })).not.toBeInTheDocument()
    expect(ensure3D).toHaveBeenCalledTimes(2)
    expect(useExperienceStore.getState().transition?.id).toBe(transitionId)
  })

  it('despacha cada destino desde una etapa estable', async () => {
    const user = userEvent.setup()
    const ensure3D = vi.fn()
    render(<ExperienceNav ensure3D={ensure3D} />)

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

    await user.click(screen.getByRole('button', { name: 'Exterior' }))
    expect(useExperienceStore.getState().transition?.to).toBe('exterior')
    expect(ensure3D).toHaveBeenCalledTimes(3)
  })
})
