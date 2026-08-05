export type ExteriorDetail = 'far' | 'mid' | 'near'

export interface Point2Mm {
  readonly x: number
  readonly y: number
}

export interface Point3Mm extends Point2Mm {
  readonly elevation: number
}

export interface Size3Mm {
  readonly width: number
  readonly depth: number
  readonly height: number
}

export interface ExteriorMassingSpec {
  readonly id: string
  readonly kind: 'city-square' | 'river-prow'
  readonly centerMm: Point2Mm
  readonly baseElevationMm: number
  readonly sizeMm: Size3Mm
  readonly rotationRad: number
  readonly taperMm: Point2Mm
}

export interface ExteriorGardenModuleSpec {
  readonly id: string
  readonly positionMm: Point3Mm
  readonly sizeMm: Size3Mm
  readonly rotationRad: number
}

export interface ExteriorGardenSpec {
  readonly id: string
  readonly placement: 'near-top'
  readonly modules: readonly ExteriorGardenModuleSpec[]
}

export interface ExteriorSignageSpec {
  readonly id: string
  readonly label: 'YPF'
  readonly positionMm: Point3Mm
  readonly widthMm: number
  readonly heightMm: number
  readonly rotationRad: number
  readonly status: 'demo-unverified'
}

export interface ExteriorSiteElementSpec {
  readonly id: string
  readonly kind: 'ground' | 'green-ring' | 'promenade' | 'street' | 'water'
  readonly centerMm: Point2Mm
  readonly elevationMm: number
  readonly sizeMm: Size3Mm
  readonly rotationRad: number
  readonly innerRadiusMm?: number
  readonly outerRadiusMm?: number
}

export interface ExteriorSiteSpec {
  readonly id: string
  readonly classification: 'conceptual'
  readonly elements: readonly ExteriorSiteElementSpec[]
}

export interface ExteriorLodSpec {
  readonly nearMaxDistanceMm: number
  readonly midMaxDistanceMm: number
}

export interface ExteriorDemoSpec {
  readonly id: string
  readonly status: 'demo-unverified'
  readonly originMm: Point2Mm
  readonly rotationRad: number
  readonly heightMm: number
  readonly floorCount: number
  readonly floor16ElevationMm: number
  readonly massing: readonly ExteriorMassingSpec[]
  readonly garden: ExteriorGardenSpec
  readonly signage: ExteriorSignageSpec
  readonly site: ExteriorSiteSpec
  readonly lod: ExteriorLodSpec
}

function deepFreeze<T>(value: T): Readonly<T> {
  if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value)
    for (const child of Object.values(value)) deepFreeze(child)
  }
  return value
}

export const EXTERIOR_DEMO_SPEC: ExteriorDemoSpec = deepFreeze({
  id: 'exterior-demo-v1',
  status: 'demo-unverified',
  originMm: { x: 31_000, y: 20_000 },
  rotationRad: Math.PI / 4,
  heightMm: 160_000,
  floorCount: 36,
  floor16ElevationMm: 0,
  massing: [
    {
      id: 'city-square',
      kind: 'city-square',
      centerMm: { x: -10_400, y: -10_400 },
      baseElevationMm: -60_000,
      sizeMm: { width: 40_000, depth: 40_000, height: 160_000 },
      rotationRad: 0,
      taperMm: { x: -1_800, y: -1_200 },
    },
    {
      id: 'river-prow',
      kind: 'river-prow',
      centerMm: { x: 11_200, y: 11_200 },
      baseElevationMm: -60_000,
      sizeMm: { width: 57_600, depth: 49_600, height: 160_000 },
      rotationRad: Math.PI,
      taperMm: { x: 2_400, y: 1_600 },
    },
  ],
  garden: {
    id: 'near-top-garden',
    placement: 'near-top',
    modules: [
      {
        id: 'near-top-garden-module-01',
        positionMm: { x: -31_500, y: -10_400, elevation: 52_200 },
        sizeMm: { width: 24_000, depth: 900, height: 4_400 },
        rotationRad: Math.PI / 2,
      },
      {
        id: 'near-top-garden-module-02',
        positionMm: { x: -31_500, y: -10_400, elevation: 56_600 },
        sizeMm: { width: 24_000, depth: 900, height: 4_400 },
        rotationRad: Math.PI / 2,
      },
      {
        id: 'near-top-garden-module-03',
        positionMm: { x: -31_500, y: -10_400, elevation: 61_000 },
        sizeMm: { width: 24_000, depth: 900, height: 4_400 },
        rotationRad: Math.PI / 2,
      },
      {
        id: 'near-top-garden-module-04',
        positionMm: { x: -31_500, y: -10_400, elevation: 65_400 },
        sizeMm: { width: 24_000, depth: 900, height: 4_400 },
        rotationRad: Math.PI / 2,
      },
      {
        id: 'near-top-garden-module-05',
        positionMm: { x: -31_500, y: -10_400, elevation: 69_800 },
        sizeMm: { width: 24_000, depth: 900, height: 4_400 },
        rotationRad: Math.PI / 2,
      },
      {
        id: 'near-top-garden-module-06',
        positionMm: { x: -31_500, y: -10_400, elevation: 74_200 },
        sizeMm: { width: 24_000, depth: 900, height: 4_400 },
        rotationRad: Math.PI / 2,
      },
    ],
  },
  signage: {
    id: 'ypf-facade-letters-demo',
    label: 'YPF',
    positionMm: { x: -32_200, y: -14_800, elevation: 87_500 },
    widthMm: 16_500,
    heightMm: 5_200,
    rotationRad: -Math.PI / 2,
    status: 'demo-unverified',
  },
  site: {
    id: 'conceptual-site',
    classification: 'conceptual',
    elements: [
      {
        id: 'conceptual-ground',
        kind: 'ground',
        centerMm: { x: 0, y: 0 },
        elevationMm: -60_100,
        sizeMm: { width: 1_600_000, depth: 1_600_000, height: 100 },
        rotationRad: 0,
      },
      {
        id: 'conceptual-green-ring',
        kind: 'green-ring',
        centerMm: { x: 0, y: 0 },
        elevationMm: -60_000,
        sizeMm: { width: 190_000, depth: 190_000, height: 80 },
        rotationRad: 0,
        innerRadiusMm: 42_000,
        outerRadiusMm: 95_000,
      },
      {
        id: 'conceptual-promenade',
        kind: 'promenade',
        centerMm: { x: 0, y: 0 },
        elevationMm: -59_980,
        sizeMm: { width: 84_000, depth: 84_000, height: 80 },
        rotationRad: 0,
        innerRadiusMm: 38_000,
        outerRadiusMm: 42_000,
      },
      {
        id: 'conceptual-street',
        kind: 'street',
        centerMm: { x: -78_000, y: 0 },
        elevationMm: -59_970,
        sizeMm: { width: 22_000, depth: 700_000, height: 80 },
        rotationRad: 0,
      },
      {
        id: 'conceptual-water',
        kind: 'water',
        centerMm: { x: 150_000, y: 0 },
        elevationMm: -59_960,
        sizeMm: { width: 60_000, depth: 380_000, height: 80 },
        rotationRad: 0,
      },
    ],
  },
  lod: {
    nearMaxDistanceMm: 110_000,
    midMaxDistanceMm: 360_000,
  },
})

function addIntegerMmError(errors: string[], value: number, path: string, positive = false) {
  if (!Number.isInteger(value)) {
    errors.push(`${path} must be an integer millimeter value`)
  } else if (positive && value <= 0) {
    errors.push(`${path} must be greater than zero`)
  }
}

function validatePoint2(errors: string[], point: Point2Mm, path: string) {
  addIntegerMmError(errors, point.x, `${path}.x`)
  addIntegerMmError(errors, point.y, `${path}.y`)
}

function validatePoint3(errors: string[], point: Point3Mm, path: string) {
  validatePoint2(errors, point, path)
  addIntegerMmError(errors, point.elevation, `${path}.elevation`)
}

function validateSize(errors: string[], size: Size3Mm, path: string) {
  addIntegerMmError(errors, size.width, `${path}.width`, true)
  addIntegerMmError(errors, size.depth, `${path}.depth`, true)
  addIntegerMmError(errors, size.height, `${path}.height`, true)
}

function validateRotation(errors: string[], rotationRad: number, path: string) {
  if (!Number.isFinite(rotationRad)) errors.push(`${path} must be a finite radian value`)
}

export function validateExteriorSpec(spec: ExteriorDemoSpec): string[] {
  const errors: string[] = []
  const ids = new Set<string>()

  function registerId(id: string, path: string) {
    if (!id.trim()) {
      errors.push(`${path} must not be empty`)
      return
    }
    if (ids.has(id)) errors.push(`${path} duplicates id "${id}"`)
    ids.add(id)
  }

  registerId(spec.id, 'id')
  if (spec.status !== 'demo-unverified') errors.push('status must be demo-unverified')
  validatePoint2(errors, spec.originMm, 'originMm')
  validateRotation(errors, spec.rotationRad, 'rotationRad')
  addIntegerMmError(errors, spec.heightMm, 'heightMm', true)
  if (!Number.isInteger(spec.floorCount) || spec.floorCount <= 0) {
    errors.push('floorCount must be a positive integer')
  }
  addIntegerMmError(errors, spec.floor16ElevationMm, 'floor16ElevationMm')

  if (spec.massing.length !== 2) errors.push('massing must contain exactly two volumes')
  const massingKinds = new Set<ExteriorMassingSpec['kind']>()
  let maximumMassingHeight = 0
  spec.massing.forEach((volume, index) => {
    const path = `massing[${index}]`
    registerId(volume.id, `${path}.id`)
    massingKinds.add(volume.kind)
    validatePoint2(errors, volume.centerMm, `${path}.centerMm`)
    addIntegerMmError(errors, volume.baseElevationMm, `${path}.baseElevationMm`)
    validateSize(errors, volume.sizeMm, `${path}.sizeMm`)
    validateRotation(errors, volume.rotationRad, `${path}.rotationRad`)
    validatePoint2(errors, volume.taperMm, `${path}.taperMm`)
    maximumMassingHeight = Math.max(maximumMassingHeight, volume.sizeMm.height)
  })
  if (!massingKinds.has('city-square') || !massingKinds.has('river-prow')) {
    errors.push('massing must include city-square and river-prow')
  }
  if (maximumMassingHeight !== spec.heightMm) {
    errors.push('heightMm must match the tallest massing volume')
  }

  registerId(spec.garden.id, 'garden.id')
  if (spec.garden.placement !== 'near-top') errors.push('garden.placement must be near-top')
  if (spec.garden.modules.length !== 6)
    errors.push('garden.modules must contain exactly six modules')
  spec.garden.modules.forEach((module, index) => {
    const path = `garden.modules[${index}]`
    registerId(module.id, `${path}.id`)
    validatePoint3(errors, module.positionMm, `${path}.positionMm`)
    validateSize(errors, module.sizeMm, `${path}.sizeMm`)
    validateRotation(errors, module.rotationRad, `${path}.rotationRad`)
  })

  registerId(spec.signage.id, 'signage.id')
  if (spec.signage.label !== 'YPF') errors.push('signage.label must be YPF')
  if (spec.signage.status !== 'demo-unverified') {
    errors.push('signage.status must be demo-unverified')
  }
  validatePoint3(errors, spec.signage.positionMm, 'signage.positionMm')
  addIntegerMmError(errors, spec.signage.widthMm, 'signage.widthMm', true)
  addIntegerMmError(errors, spec.signage.heightMm, 'signage.heightMm', true)
  validateRotation(errors, spec.signage.rotationRad, 'signage.rotationRad')

  registerId(spec.site.id, 'site.id')
  if (spec.site.classification !== 'conceptual') {
    errors.push('site.classification must be conceptual')
  }
  spec.site.elements.forEach((element, index) => {
    const path = `site.elements[${index}]`
    registerId(element.id, `${path}.id`)
    validatePoint2(errors, element.centerMm, `${path}.centerMm`)
    addIntegerMmError(errors, element.elevationMm, `${path}.elevationMm`)
    validateSize(errors, element.sizeMm, `${path}.sizeMm`)
    validateRotation(errors, element.rotationRad, `${path}.rotationRad`)
    if (element.innerRadiusMm !== undefined) {
      addIntegerMmError(errors, element.innerRadiusMm, `${path}.innerRadiusMm`, true)
    }
    if (element.outerRadiusMm !== undefined) {
      addIntegerMmError(errors, element.outerRadiusMm, `${path}.outerRadiusMm`, true)
    }
    if (
      element.innerRadiusMm !== undefined &&
      element.outerRadiusMm !== undefined &&
      element.innerRadiusMm >= element.outerRadiusMm
    ) {
      errors.push(`${path}.innerRadiusMm must be less than outerRadiusMm`)
    }
  })

  addIntegerMmError(errors, spec.lod.nearMaxDistanceMm, 'lod.nearMaxDistanceMm', true)
  addIntegerMmError(errors, spec.lod.midMaxDistanceMm, 'lod.midMaxDistanceMm', true)
  if (spec.lod.nearMaxDistanceMm >= spec.lod.midMaxDistanceMm) {
    errors.push('lod.nearMaxDistanceMm must be less than midMaxDistanceMm')
  }

  return errors
}

export function resolveExteriorDetail(
  distanceMm: number,
  maxDetail: ExteriorDetail,
): ExteriorDetail {
  const normalizedDistance = Number.isFinite(distanceMm) ? Math.max(0, distanceMm) : Infinity
  const rawDetail: ExteriorDetail =
    normalizedDistance < EXTERIOR_DEMO_SPEC.lod.nearMaxDistanceMm
      ? 'near'
      : normalizedDistance < EXTERIOR_DEMO_SPEC.lod.midMaxDistanceMm
        ? 'mid'
        : 'far'

  if (rawDetail === 'far' || maxDetail === 'far') return 'far'
  if (rawDetail === 'mid' || maxDetail === 'mid') return 'mid'
  return 'near'
}
