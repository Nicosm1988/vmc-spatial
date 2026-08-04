import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { QualityPreference, ResolvedQuality, SceneStage } from '../domain/experience'

interface ExperienceState {
  stage: SceneStage
  qualityPreference: QualityPreference
  resolvedQuality: ResolvedQuality
  night: boolean
  transitioning: boolean
  goExterior: () => void
  goToFloor16: () => void
  settleAtFloor16: () => void
  enterInterior: () => void
  finishTransition: () => void
  cancelTransition: () => void
  setQualityPreference: (quality: QualityPreference) => void
  setResolvedQuality: (quality: ResolvedQuality) => void
  toggleNight: () => void
}

export const useExperienceStore = create<ExperienceState>()(
  persist(
    (set, get) => ({
      stage: 'exterior',
      qualityPreference: 'auto',
      resolvedQuality: 'performance',
      night: false,
      transitioning: false,
      goExterior: () => set({ stage: 'exterior', transitioning: true }),
      goToFloor16: () => set({ stage: 'approach16', transitioning: true }),
      settleAtFloor16: () => set({ stage: 'floor16', transitioning: false }),
      enterInterior: () => set({ stage: 'interior', transitioning: true }),
      finishTransition: () => set({ transitioning: false }),
      cancelTransition: () => {
        const stage = get().stage
        set({
          stage: stage === 'approach16' ? 'exterior' : stage,
          transitioning: false,
        })
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
