import * as THREE from 'three'
import { mmToMeters } from '../../domain/units'

const MIN_CONTOUR_SEGMENTS = 8

function signedPow(value: number, exponent: number) {
  return Math.sign(value) * Math.abs(value) ** exponent
}

export function createRoundedSquareShape(
  widthMm: number,
  depthMm: number,
  segments = 32,
): THREE.Shape {
  const count = Math.max(MIN_CONTOUR_SEGMENTS, Math.round(segments))
  const halfWidth = mmToMeters(widthMm) / 2
  const halfDepth = mmToMeters(depthMm) / 2
  const exponent = 2 / 4.6
  const points = Array.from({ length: count }, (_, index) => {
    const angle = (index / count) * Math.PI * 2
    return new THREE.Vector2(
      halfWidth * signedPow(Math.cos(angle), exponent),
      halfDepth * signedPow(Math.sin(angle), exponent),
    )
  })
  return new THREE.Shape(points)
}

export function createCurvedProwShape(
  widthMm: number,
  depthMm: number,
  curveSegments = 10,
): THREE.Shape {
  const halfWidth = mmToMeters(widthMm) / 2
  const halfDepth = mmToMeters(depthMm) / 2
  const shape = new THREE.Shape()

  shape.moveTo(halfWidth, 0)
  shape.quadraticCurveTo(halfWidth * 0.36, halfDepth * 1.08, -halfWidth * 0.82, halfDepth * 0.9)
  shape.quadraticCurveTo(-halfWidth * 1.08, 0, -halfWidth * 0.82, -halfDepth * 0.9)
  shape.quadraticCurveTo(halfWidth * 0.36, -halfDepth * 1.08, halfWidth, 0)
  shape.closePath()

  const sampled = shape.getSpacedPoints(Math.max(MIN_CONTOUR_SEGMENTS, curveSegments * 3))
  return new THREE.Shape(sampled)
}

export function createMassingGeometry(
  shape: THREE.Shape,
  heightMm: number,
  baseElevationMm: number,
  topShiftXMm = 0,
  topShiftYMm = 0,
): THREE.ExtrudeGeometry {
  const height = mmToMeters(heightMm)
  const baseElevation = mmToMeters(baseElevationMm)
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: height,
    bevelEnabled: false,
    curveSegments: 8,
    steps: 1,
  })

  geometry.rotateX(-Math.PI / 2)
  const positions = geometry.getAttribute('position')
  const shiftX = mmToMeters(topShiftXMm)
  const shiftZ = mmToMeters(topShiftYMm)

  for (let index = 0; index < positions.count; index += 1) {
    const localY = positions.getY(index)
    const progress = THREE.MathUtils.clamp(localY / height, 0, 1)
    positions.setXYZ(
      index,
      positions.getX(index) + shiftX * progress,
      localY + baseElevation,
      positions.getZ(index) + shiftZ * progress,
    )
  }

  positions.needsUpdate = true
  geometry.computeVertexNormals()
  geometry.computeBoundingBox()
  geometry.computeBoundingSphere()
  return geometry
}

interface FacadeLineOptions {
  baseElevationMm: number
  heightMm: number
  horizontalBands: number
  verticalEvery: number
  contourSegments?: number
  outwardScale?: number
}

export function createFacadeLineGeometry(
  shape: THREE.Shape,
  {
    baseElevationMm,
    heightMm,
    horizontalBands,
    verticalEvery,
    contourSegments = 32,
    outwardScale = 1.006,
  }: FacadeLineOptions,
): THREE.BufferGeometry {
  const contour = shape
    .getSpacedPoints(Math.max(MIN_CONTOUR_SEGMENTS, contourSegments))
    .slice(0, -1)
    .map((point) => point.multiplyScalar(outwardScale))
  const base = mmToMeters(baseElevationMm)
  const height = mmToMeters(heightMm)
  const vertices: number[] = []

  for (let band = 0; band <= horizontalBands; band += 1) {
    const y = base + (band / horizontalBands) * height
    for (let index = 0; index < contour.length; index += 1) {
      const point = contour[index]
      const next = contour[(index + 1) % contour.length]
      if (!point || !next) continue
      vertices.push(point.x, y, -point.y, next.x, y, -next.y)
    }
  }

  const step = Math.max(1, Math.round(verticalEvery))
  for (let index = 0; index < contour.length; index += step) {
    const point = contour[index]
    if (!point) continue
    vertices.push(point.x, base, -point.y, point.x, base + height, -point.y)
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
  geometry.computeBoundingBox()
  geometry.computeBoundingSphere()
  return geometry
}

export function geometryHasFinitePositions(geometry: THREE.BufferGeometry) {
  const positions = geometry.getAttribute('position')
  for (let index = 0; index < positions.count; index += 1) {
    if (
      !Number.isFinite(positions.getX(index)) ||
      !Number.isFinite(positions.getY(index)) ||
      !Number.isFinite(positions.getZ(index))
    ) {
      return false
    }
  }
  return true
}
