import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useExperienceStore } from '../state/useExperienceStore'
import ExperienceNav from './ExperienceNav'

function resetExperience() {
  useExperienceStore.setState({
    stage: 'exterior',
    qualityPreference: 'auto',
    resolvedQuality: 'performance',
    night: false,
    transitioning: false,
  })
}

describe('ExperienceNav', () => {
  beforeEach(() => {
    localStorage.clear()
    resetExperience()
  })

  afterEach(() => {
    cleanup()
  })

  it('runs every navigation action after ensuring the 3D view', async () => {
    const user = userEvent.setup()
    const ensure3D = vi.fn()
    render(<ExperienceNav ensure3D={ensure3D} />)

    const exterior = screen.getByRole('button', { name: /Exterior/ })
    const floor16 = screen.getByRole('button', { name: /Ir al piso 16/ })
    const interior = screen.getByRole('button', { name: /Entrar a la sala/ })

    expect(screen.getByTestId('scene-stage')).toHaveTextContent('Exterior · Puerto Madero')
    expect(exterior).toHaveClass('active')

    await user.click(floor16)
    expect(ensure3D).toHaveBeenCalledTimes(1)
    expect(useExperienceStore.getState()).toMatchObject({
      stage: 'approach16',
      transitioning: true,
    })
    expect(screen.getByTestId('scene-stage')).toHaveTextContent('Vuelo al piso 16')
    expect(floor16).toBeDisabled()
    expect(floor16).toHaveClass('active')

    await user.click(interior)
    expect(ensure3D).toHaveBeenCalledTimes(2)
    expect(useExperienceStore.getState()).toMatchObject({
      stage: 'interior',
      transitioning: true,
    })
    expect(screen.getByTestId('scene-stage')).toHaveTextContent('Sala demostrativa · Piso 16')
    expect(interior).toHaveClass('active')

    await user.click(exterior)
    expect(ensure3D).toHaveBeenCalledTimes(3)
    expect(useExperienceStore.getState()).toMatchObject({
      stage: 'exterior',
      transitioning: true,
    })
    expect(screen.getByTestId('scene-stage')).toHaveTextContent('Exterior · Puerto Madero')
    expect(exterior).toHaveClass('active')
  })
})
