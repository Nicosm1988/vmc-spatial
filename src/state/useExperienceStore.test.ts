import { beforeEach, describe, expect, it } from 'vitest'
import { useExperienceStore } from './useExperienceStore'

const STORAGE_KEY = 'vmc-spatial:experience:v1'

function resetExperience() {
  useExperienceStore.setState({
    stage: 'exterior',
    qualityPreference: 'auto',
    resolvedQuality: 'performance',
    night: false,
    transitioning: false,
  })
}

describe('experience store', () => {
  beforeEach(() => {
    localStorage.clear()
    resetExperience()
    localStorage.clear()
  })

  it('transitions from exterior to the floor 16 approach and settles there', () => {
    useExperienceStore.getState().goToFloor16()
    expect(useExperienceStore.getState()).toMatchObject({
      stage: 'approach16',
      transitioning: true,
    })

    useExperienceStore.getState().settleAtFloor16()
    expect(useExperienceStore.getState()).toMatchObject({
      stage: 'floor16',
      transitioning: false,
    })
  })

  it('enters the interior and finishes the camera transition', () => {
    useExperienceStore.getState().enterInterior()
    expect(useExperienceStore.getState()).toMatchObject({
      stage: 'interior',
      transitioning: true,
    })

    useExperienceStore.getState().finishTransition()
    expect(useExperienceStore.getState()).toMatchObject({
      stage: 'interior',
      transitioning: false,
    })
  })

  it('cancels an approach back to the exterior', () => {
    useExperienceStore.getState().goToFloor16()
    useExperienceStore.getState().cancelTransition()

    expect(useExperienceStore.getState()).toMatchObject({
      stage: 'exterior',
      transitioning: false,
    })
  })

  it('starts a return to the exterior from the interior', () => {
    useExperienceStore.getState().enterInterior()
    useExperienceStore.getState().goExterior()

    expect(useExperienceStore.getState()).toMatchObject({
      stage: 'exterior',
      transitioning: true,
    })
  })

  it('updates and persists only user preferences', () => {
    useExperienceStore.getState().setQualityPreference('cinematic')
    useExperienceStore.getState().setResolvedQuality('balanced')
    useExperienceStore.getState().toggleNight()
    useExperienceStore.getState().enterInterior()

    expect(useExperienceStore.getState()).toMatchObject({
      qualityPreference: 'cinematic',
      resolvedQuality: 'balanced',
      night: true,
    })

    const persisted = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as {
      state?: Record<string, unknown>
      version?: number
    }
    expect(persisted.version).toBe(1)
    expect(persisted.state).toEqual({ qualityPreference: 'cinematic', night: true })
    expect(persisted.state).not.toHaveProperty('stage')
    expect(persisted.state).not.toHaveProperty('resolvedQuality')
    expect(persisted.state).not.toHaveProperty('transitioning')
  })
})
