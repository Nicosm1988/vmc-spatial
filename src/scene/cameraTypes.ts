import type { MutableRefObject } from 'react'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'

export type OrbitControlsHandle = OrbitControlsImpl

export interface CamApi {
  zoom?: (factor: number) => void
  orbit?: (degrees: number) => void
  tilt?: (degrees: number) => void
  reset?: () => void
  top?: () => void
  enter?: () => void
  capture?: () => void
}

export type CamApiRef = MutableRefObject<CamApi>
