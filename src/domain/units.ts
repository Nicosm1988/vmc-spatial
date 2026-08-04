export const MM_PER_METER = 1000

export type Millimeters = number
export type Meters = number

export function mmToMeters(value: Millimeters): Meters {
  return value / MM_PER_METER
}

export function metersToMm(value: Meters): Millimeters {
  return Math.round(value * MM_PER_METER)
}
