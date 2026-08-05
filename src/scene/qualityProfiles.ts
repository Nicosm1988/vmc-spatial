import type { QualityPreference, ResolvedQuality } from '../domain/experience'
import type { ExteriorDetail } from '../domain/exteriorSpec'

export interface QualityProfile {
  dpr: number
  shadows: boolean
  shadowMapSize: 512 | 1024 | 2048
  postprocessing: boolean
  exteriorDetail: ExteriorDetail
}

export const QUALITY_PROFILES: Record<ResolvedQuality, QualityProfile> = {
  performance: {
    dpr: 1,
    shadows: false,
    shadowMapSize: 512,
    postprocessing: false,
    exteriorDetail: 'mid',
  },
  balanced: {
    dpr: 1.25,
    shadows: true,
    shadowMapSize: 1024,
    postprocessing: false,
    exteriorDetail: 'near',
  },
  cinematic: {
    dpr: 1.75,
    shadows: true,
    shadowMapSize: 2048,
    postprocessing: true,
    exteriorDetail: 'near',
  },
}

interface DeviceHints {
  hardwareConcurrency?: number
  deviceMemory?: number
  reducedMotion?: boolean
}

export function resolveQuality(
  preference: QualityPreference,
  hints: DeviceHints = {},
): ResolvedQuality {
  if (preference !== 'auto') return preference

  const cores = hints.hardwareConcurrency ?? 4
  const memory = hints.deviceMemory ?? 4
  return cores >= 6 && memory >= 6 ? 'balanced' : 'performance'
}

export function readDeviceHints(): DeviceHints {
  const extendedNavigator = navigator as Navigator & { deviceMemory?: number }
  return {
    hardwareConcurrency: navigator.hardwareConcurrency,
    deviceMemory: extendedNavigator.deviceMemory,
    reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  }
}
