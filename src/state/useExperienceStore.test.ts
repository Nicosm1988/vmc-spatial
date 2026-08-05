import { beforeEach, describe, expect, it } from 'vitest'
import { useExperienceStore } from './useExperienceStore'

const STORAGE_KEY = 'vmc-spatial:experience:v1'

function resetExperience() {
  useExperienceStore.setState({
    stage: 'exterior',
    activeScene: 'exterior',
    transition: null,
    transitioning: false,
    reducedMotion: false,
    transitionSequence: 0,
    qualityPreference: 'auto',
    resolvedQuality: 'performance',
    night: false,
  })
}

describe('experience store', () => {
  beforeEach(() => {
    localStorage.clear()
    resetExperience()
    localStorage.clear()
  })

  it('keeps a stable stage while a tokenized floor 16 flight is running', () => {
    const id = useExperienceStore.getState().goToFloor16()

    expect(id).toBe(1)
    expect(useExperienceStore.getState()).toMatchObject({
      stage: 'exterior',
      activeScene: 'exterior',
      transitioning: true,
      transition: {
        id,
        routeId: 'cinematic-exterior-floor16-v3',
        from: 'exterior',
        to: 'floor16',
        phase: 'flight',
        progress: 0,
        handedOff: false,
      },
    })

    expect(useExperienceStore.getState().goToFloor16()).toBe(id)
    expect(useExperienceStore.getState().transitionSequence).toBe(1)

    expect(useExperienceStore.getState().handoffTransition(id!)).toBe(true)
    expect(useExperienceStore.getState()).toMatchObject({
      stage: 'exterior',
      activeScene: 'exterior',
      transition: { id, phase: 'handoff', progress: 0.84, handedOff: true },
    })

    expect(useExperienceStore.getState().completeTransition(id!)).toBe(true)
    expect(useExperienceStore.getState()).toMatchObject({
      stage: 'floor16',
      activeScene: 'exterior',
      transition: null,
      transitioning: false,
    })
  })

  it('hands rendering to the interior before committing the destination stage', () => {
    const floorFlight = useExperienceStore.getState().goToFloor16()!
    useExperienceStore.getState().completeTransition(floorFlight)

    const entry = useExperienceStore.getState().enterInterior()!
    expect(useExperienceStore.getState()).toMatchObject({
      stage: 'floor16',
      activeScene: 'exterior',
      transition: { id: entry, from: 'floor16', to: 'interior' },
    })

    expect(useExperienceStore.getState().handoffTransition(entry)).toBe(true)
    expect(useExperienceStore.getState()).toMatchObject({
      stage: 'floor16',
      activeScene: 'interior',
      transition: { id: entry, phase: 'handoff', progress: 0.5, handedOff: true },
    })

    expect(useExperienceStore.getState().setTransitionPhase(entry, 'reveal')).toBe(true)
    expect(useExperienceStore.getState().completeTransition(entry)).toBe(true)
    expect(useExperienceStore.getState()).toMatchObject({
      stage: 'interior',
      activeScene: 'interior',
      transition: null,
      transitioning: false,
    })
  })

  it('invalidates late callbacks when a newer navigation intent wins', () => {
    const staleId = useExperienceStore.getState().goToFloor16()!
    const latestId = useExperienceStore.getState().enterInterior()!

    expect(latestId).toBeGreaterThan(staleId)
    expect(useExperienceStore.getState().transition).toMatchObject({
      id: latestId,
      from: 'exterior',
      to: 'interior',
    })

    expect(useExperienceStore.getState().setTransitionProgress(staleId, 0.8)).toBe(false)
    expect(useExperienceStore.getState().setTransitionPhase(staleId, 'cover')).toBe(false)
    expect(useExperienceStore.getState().handoffTransition(staleId)).toBe(false)
    expect(useExperienceStore.getState().completeTransition(staleId)).toBe(false)
    expect(useExperienceStore.getState().transition).toMatchObject({ id: latestId, progress: 0 })
  })

  it('cancels safely back to the origin even after a semantic handoff', () => {
    const id = useExperienceStore.getState().enterInterior()!
    useExperienceStore.getState().handoffTransition(id)
    expect(useExperienceStore.getState().activeScene).toBe('interior')

    expect(useExperienceStore.getState().cancelTransition()).toBe(true)
    expect(useExperienceStore.getState()).toMatchObject({
      stage: 'exterior',
      activeScene: 'exterior',
      transition: null,
      transitioning: false,
    })
    expect(useExperienceStore.getState().completeTransition(id)).toBe(false)
    expect(useExperienceStore.getState().cancelTransition()).toBe(false)
  })

  it('is idempotent for the current stage and clamps finite progress', () => {
    expect(useExperienceStore.getState().goExterior()).toBeNull()
    expect(useExperienceStore.getState().transitionSequence).toBe(0)

    const id = useExperienceStore.getState().goToFloor16()!
    expect(useExperienceStore.getState().setTransitionProgress(id, -0.5)).toBe(true)
    expect(useExperienceStore.getState().transition?.progress).toBe(0)
    expect(useExperienceStore.getState().setTransitionProgress(id, 1.5)).toBe(true)
    expect(useExperienceStore.getState().transition?.progress).toBe(1)
    expect(useExperienceStore.getState().setTransitionProgress(id, Number.NaN)).toBe(false)
    expect(useExperienceStore.getState().transition?.progress).toBe(1)

    expect(useExperienceStore.getState().goExterior()).toBeNull()
    expect(useExperienceStore.getState()).toMatchObject({
      stage: 'exterior',
      transition: null,
      transitioning: false,
    })
  })

  it('keeps the legacy completion wrappers token-safe', () => {
    expect(useExperienceStore.getState().settleAtFloor16()).toBe(false)
    expect(useExperienceStore.getState().finishTransition()).toBe(false)

    useExperienceStore.getState().goToFloor16()
    expect(useExperienceStore.getState().settleAtFloor16()).toBe(true)
    expect(useExperienceStore.getState().stage).toBe('floor16')

    useExperienceStore.getState().enterInterior()
    expect(useExperienceStore.getState().finishTransition()).toBe(true)
    expect(useExperienceStore.getState().stage).toBe('interior')
  })

  it('settles synchronously without a transient route when reduced motion is active', () => {
    useExperienceStore.getState().setReducedMotion(true)

    expect(useExperienceStore.getState().goToFloor16()).toBeNull()
    expect(useExperienceStore.getState()).toMatchObject({
      stage: 'floor16',
      activeScene: 'exterior',
      transition: null,
      transitioning: false,
    })

    expect(useExperienceStore.getState().enterInterior()).toBeNull()
    expect(useExperienceStore.getState()).toMatchObject({
      stage: 'interior',
      activeScene: 'interior',
      transition: null,
      transitioning: false,
    })
  })

  it('persists only user preferences, excluding camera and reduced-motion state', () => {
    useExperienceStore.getState().setQualityPreference('cinematic')
    useExperienceStore.getState().setResolvedQuality('balanced')
    useExperienceStore.getState().toggleNight()
    useExperienceStore.getState().setReducedMotion(true)
    useExperienceStore.getState().enterInterior()

    expect(useExperienceStore.getState()).toMatchObject({
      qualityPreference: 'cinematic',
      resolvedQuality: 'balanced',
      night: true,
      reducedMotion: true,
      stage: 'interior',
      transitioning: false,
    })

    const persisted = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as {
      state?: Record<string, unknown>
      version?: number
    }
    expect(persisted.version).toBe(1)
    expect(persisted.state).toEqual({ qualityPreference: 'cinematic', night: true })
    expect(persisted.state).not.toHaveProperty('stage')
    expect(persisted.state).not.toHaveProperty('activeScene')
    expect(persisted.state).not.toHaveProperty('transition')
    expect(persisted.state).not.toHaveProperty('transitioning')
    expect(persisted.state).not.toHaveProperty('reducedMotion')
    expect(persisted.state).not.toHaveProperty('transitionSequence')
    expect(persisted.state).not.toHaveProperty('resolvedQuality')
  })
})
