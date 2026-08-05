import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'

/**
 * Local, asset-free image-based lighting for PBR materials. It never fetches
 * an HDRI or publishes a photographic reference.
 */
export default function ProceduralEnvironment() {
  const { gl, scene } = useThree()

  useEffect(() => {
    const previousEnvironment = scene.environment
    const generator = new THREE.PMREMGenerator(gl)
    const room = new RoomEnvironment()
    const target = generator.fromScene(room, 0.04)
    generator.dispose()
    room.dispose()
    // Three.js is an imperative external system; this effect owns the PMREM
    // assignment and restores the previous scene value during StrictMode replay.
    // eslint-disable-next-line react-hooks/immutability
    scene.environment = target.texture

    return () => {
      if (scene.environment === target.texture) scene.environment = previousEnvironment
      target.dispose()
    }
  }, [gl, scene])

  return null
}
