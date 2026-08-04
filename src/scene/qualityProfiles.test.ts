import { describe, expect, it } from 'vitest'
import { QUALITY_PROFILES, resolveQuality } from './qualityProfiles'

describe('quality profile resolution', () => {
  it.each(['performance', 'balanced', 'cinematic'] as const)(
    'honors an explicit %s preference',
    (preference) => {
      expect(
        resolveQuality(preference, {
          hardwareConcurrency: 1,
          deviceMemory: 1,
          reducedMotion: true,
        }),
      ).toBe(preference)
    },
  )

  it('uses performance for auto when reduced motion is requested', () => {
    expect(
      resolveQuality('auto', {
        hardwareConcurrency: 16,
        deviceMemory: 16,
        reducedMotion: true,
      }),
    ).toBe('performance')
  })

  it('uses balanced for capable devices in auto mode', () => {
    expect(resolveQuality('auto', { hardwareConcurrency: 6, deviceMemory: 6 })).toBe('balanced')
    expect(resolveQuality('auto', { hardwareConcurrency: 12, deviceMemory: 8 })).toBe('balanced')
  })

  it.each([
    { hardwareConcurrency: 5, deviceMemory: 8 },
    { hardwareConcurrency: 8, deviceMemory: 5 },
    {},
  ])('uses performance for constrained or unknown devices in auto mode (%o)', (hints) => {
    expect(resolveQuality('auto', hints)).toBe('performance')
  })

  it('keeps cinematic effects progressive and disabled in lower profiles', () => {
    expect(QUALITY_PROFILES.performance.postprocessing).toBe(false)
    expect(QUALITY_PROFILES.balanced.postprocessing).toBe(false)
    expect(QUALITY_PROFILES.cinematic.postprocessing).toBe(true)
    expect(QUALITY_PROFILES.performance.dpr).toBeLessThan(QUALITY_PROFILES.cinematic.dpr)
    expect(QUALITY_PROFILES.performance.exteriorDetail).toBe('mid')
    expect(QUALITY_PROFILES.balanced.exteriorDetail).toBe('near')
  })
})
