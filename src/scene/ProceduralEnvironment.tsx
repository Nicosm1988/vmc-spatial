import { useEffect, useMemo } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'

/**
 * Local, asset-free image-based lighting for PBR materials. It never fetches
 * an HDRI or publishes a photographic reference.
 */
export default function ProceduralEnvironment() {
  const gl = useThree((state) => state.gl)
  const environment = useMemo(() => {
    const generator = new THREE.PMREMGenerator(gl)
    const room = new RoomEnvironment()
    const target = generator.fromScene(room, 0.04)
    generator.dispose()
    room.dispose()
    return target
  }, [gl])

  useEffect(() => {
    return () => {
      environment.dispose()
    }
  }, [environment])

  return <primitive attach="environment" object={environment.texture} />
}
