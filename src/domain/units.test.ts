import { describe, expect, it } from 'vitest'
import { toM } from '../lib/geometry'
import { MM_PER_METER, metersToMm, mmToMeters } from './units'

describe('millimeter conversions', () => {
  it('converts integer domain millimeters to render meters', () => {
    expect(MM_PER_METER).toBe(1000)
    expect(mmToMeters(0)).toBe(0)
    expect(mmToMeters(1250)).toBe(1.25)
    expect(mmToMeters(-250)).toBe(-0.25)
    expect(toM(2900)).toBe(2.9)
  })

  it('rounds meters to the nearest integer millimeter at the input boundary', () => {
    expect(metersToMm(1.2344)).toBe(1234)
    expect(metersToMm(1.2345)).toBe(1235)
  })

  it('round-trips integer millimeters without losing precision', () => {
    for (const millimeters of [0, 1, 999, 1000, 62_000, -4_250]) {
      expect(metersToMm(mmToMeters(millimeters))).toBe(millimeters)
    }
  })
})
