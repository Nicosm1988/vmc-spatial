import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import {
  getCinematicRoute,
  type CinematicRouteId,
  type CinematicTransitionPhase,
} from '../domain/cinematicAccess'
import {
  getActiveScene,
  type ActiveScene,
  type QualityPreference,
  type ResolvedQuality,
  type StableSceneStage,
} from '../domain/experience'

export interface ExperienceTransition {
  readonly id: number
  readonly routeId: CinematicRouteId
  readonly from: StableSceneStage
  readonly to: StableSceneStage
  readonly phase: CinematicTransitionPhase
  readonly progress: number
  readonly handedOff: boolean
}

export interface ExperienceState {
  /** Last completed navigation destination. It never contains a transient camera phase. */
  stage: StableSceneStage
  /** Render tree currently mounted; it can change before the stable stage commits. */
  activeScene: ActiveScene
  transition: ExperienceTransition | null
  /** Compatibility selector for existing UI while it migrates to transition !== null. */
  transitioning: boolean
  /** Ephemeral media preference. It is intentionally excluded from persistence. */
  reducedMotion: boolean
  transitionSequence: number
  qualityPreference: QualityPreference
  resolvedQuality: ResolvedQuality
  night: boolean
  navigate: (target: StableSceneStage) => number | null
  goExterior: () => number | null
  goToFloor16: () => number | null
  enterInterior: () => number | null
  setTransitionPhase: (id: number, phase: CinematicTransitionPhase) => boolean
  setTransitionProgress: (id: number, progress: number) => boolean
  handoffTransition: (id: number) => boolean
  completeTransition: (id: number) => boolean
  cancelTransition: () => boolean
  /** Compatibility completion wrapper for the former approach16 camera stage. */
  settleAtFloor16: () => boolean
  /** Compatibility completion wrapper for the former untokenized camera transition. */
  finishTransition: () => boolean
  setReducedMotion: (reducedMotion: boolean) => void
  setQualityPreference: (quality: QualityPreference) => void
  setResolvedQuality: (quality: ResolvedQuality) => void
  toggleNight: () => void
}

export const useExperienceStore = create<ExperienceState>()(
  persist(
    (set, get) => ({
      stage: 'exterior',
      activeScene: 'exterior',
      transition: null,
      transitioning: false,
      reducedMotion: false,
      transitionSequence: 0,
      qualityPreference: 'auto',
      resolvedQuality: 'performance',
      night: false,
      navigate: (target) => {
        const state = get()
        const current = state.transition

        if (current?.to === target) return current.id
        if (!current && state.stage === target) return null

        if (current && target === current.from) {
          state.cancelTransition()
          return null
        }

        const route = getCinematicRoute(state.stage, target)
        if (!route) return null

        if (state.reducedMotion) {
          set({
            stage: target,
            activeScene: route.toActiveScene,
            transition: null,
            transitioning: false,
          })
          return null
        }

        const id = state.transitionSequence + 1
        set({
          activeScene: route.fromActiveScene,
          transitionSequence: id,
          transition: {
            id,
            routeId: route.id,
            from: route.from,
            to: route.to,
            phase: 'flight',
            progress: 0,
            handedOff: false,
          },
          transitioning: true,
        })
        return id
      },
      goExterior: () => get().navigate('exterior'),
      goToFloor16: () => get().navigate('floor16'),
      enterInterior: () => get().navigate('interior'),
      setTransitionPhase: (id, phase) => {
        const transition = get().transition
        if (!transition || transition.id !== id) return false
        if (transition.phase === phase) return true

        set({ transition: { ...transition, phase } })
        return true
      },
      setTransitionProgress: (id, progress) => {
        const transition = get().transition
        if (!transition || transition.id !== id || !Number.isFinite(progress)) return false

        const nextProgress = Math.min(1, Math.max(0, progress))
        if (transition.progress === nextProgress) return true
        set({ transition: { ...transition, progress: nextProgress } })
        return true
      },
      handoffTransition: (id) => {
        const transition = get().transition
        if (!transition || transition.id !== id) return false
        if (transition.handedOff) return true

        const route = getCinematicRoute(transition.from, transition.to)
        if (!route || route.id !== transition.routeId) return false

        set({
          activeScene: route.toActiveScene,
          transition: {
            ...transition,
            phase: 'handoff',
            progress: Math.max(transition.progress, route.handoffProgress),
            handedOff: true,
          },
        })
        return true
      },
      completeTransition: (id) => {
        const transition = get().transition
        if (!transition || transition.id !== id) return false

        set({
          stage: transition.to,
          activeScene: getActiveScene(transition.to),
          transition: null,
          transitioning: false,
        })
        return true
      },
      cancelTransition: () => {
        const transition = get().transition
        if (!transition) return false

        set({
          stage: transition.from,
          activeScene: getActiveScene(transition.from),
          transition: null,
          transitioning: false,
        })
        return true
      },
      settleAtFloor16: () => {
        const transition = get().transition
        if (!transition || transition.to !== 'floor16') return false
        return get().completeTransition(transition.id)
      },
      finishTransition: () => {
        const transition = get().transition
        if (!transition) return false
        return get().completeTransition(transition.id)
      },
      setReducedMotion: (reducedMotion) => {
        if (get().reducedMotion !== reducedMotion) set({ reducedMotion })
      },
      setQualityPreference: (qualityPreference) => set({ qualityPreference }),
      setResolvedQuality: (resolvedQuality) => set({ resolvedQuality }),
      toggleNight: () => set((state) => ({ night: !state.night })),
    }),
    {
      name: 'vmc-spatial:experience:v1',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        qualityPreference: state.qualityPreference,
        night: state.night,
      }),
    },
  ),
)
