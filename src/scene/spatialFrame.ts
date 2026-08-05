import { EXTERIOR_DEMO_SPEC } from '../domain/exteriorSpec'
import { mmToMeters } from '../domain/units'

/** Floor-plan coordinates in render meters; x/y are horizontal. */
export interface FloorPointMeters {
  readonly x: number
  readonly y: number
  readonly elevation: number
}

/** Three.js world coordinates in render meters; y is vertical. */
export interface WorldPointMeters {
  readonly x: number
  readonly y: number
  readonly z: number
}

export interface FloorCenterMeters {
  readonly x: number
  readonly y: number
}

export const FLOOR16_WORLD_FRAME = Object.freeze({
  centerXM: mmToMeters(EXTERIOR_DEMO_SPEC.originMm.x),
  centerYM: mmToMeters(EXTERIOR_DEMO_SPEC.originMm.y),
  elevationM: mmToMeters(EXTERIOR_DEMO_SPEC.floor16ElevationMm),
  rotationRad: EXTERIOR_DEMO_SPEC.rotationRad,
})

const COS_ROTATION = Math.cos(FLOOR16_WORLD_FRAME.rotationRad)
const SIN_ROTATION = Math.sin(FLOOR16_WORLD_FRAME.rotationRad)

const DEFAULT_FLOOR_CENTER: FloorCenterMeters = Object.freeze({
  x: FLOOR16_WORLD_FRAME.centerXM,
  y: FLOOR16_WORLD_FRAME.centerYM,
})

/** Maps a floor-plan point into the shared Three.js world frame. */
export function floorLocalToWorld(
  point: FloorPointMeters,
  floorCenter: FloorCenterMeters = DEFAULT_FLOOR_CENTER,
): WorldPointMeters {
  const localX = point.x - floorCenter.x
  const localY = point.y - floorCenter.y

  return {
    x: FLOOR16_WORLD_FRAME.centerXM + localX * COS_ROTATION + localY * SIN_ROTATION,
    y: FLOOR16_WORLD_FRAME.elevationM + point.elevation,
    z: FLOOR16_WORLD_FRAME.centerYM - localX * SIN_ROTATION + localY * COS_ROTATION,
  }
}

/** Maps a shared Three.js world point back into floor-plan coordinates. */
export function worldToFloorLocal(
  point: WorldPointMeters,
  floorCenter: FloorCenterMeters = DEFAULT_FLOOR_CENTER,
): FloorPointMeters {
  const worldX = point.x - FLOOR16_WORLD_FRAME.centerXM
  const worldZ = point.z - FLOOR16_WORLD_FRAME.centerYM

  return {
    x: floorCenter.x + worldX * COS_ROTATION - worldZ * SIN_ROTATION,
    y: floorCenter.y + worldX * SIN_ROTATION + worldZ * COS_ROTATION,
    elevation: point.y - FLOOR16_WORLD_FRAME.elevationM,
  }
}
