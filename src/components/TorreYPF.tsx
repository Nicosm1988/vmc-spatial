// ============================================================================
// Volumetría DEMO de Torre YPF. No representa un plano validado ni detalles
// operacionales. La geometría procedural se reemplazará de forma iterativa sólo
// con referencias públicas permitidas y medidas aprobadas.
// ============================================================================
import { useMemo } from 'react'
import * as THREE from 'three'

const FLOOR_H = 3.7,
  FLOORS = 36,
  CUT = 16,
  SIDE = 40,
  H = FLOORS * FLOOR_H
const GROUND = -(CUT - 1) * FLOOR_H // y del suelo real (piso 16 en y=0)
const TREE_COLORS = ['#2f6d3a', '#3f8a49', '#357a3e'] as const
const SKY_GARDEN_COLORS = ['#2f6d3a', '#3f8a49', '#276031'] as const
const NEIGHBOR_BUILDINGS: ReadonlyArray<readonly [number, number, number]> = [
  [120, 66, 55],
  [155, 52, 20],
  [110, 78, -60],
]

function facadeMat(noche: boolean) {
  return (
    <meshStandardMaterial
      color={noche ? '#0c1a2c' : '#8fb0cc'}
      metalness={0.9}
      roughness={0.1}
      envMapIntensity={1.5}
    />
  )
}
function facadeGrid(w: number, d: number, floors: number, y0: number) {
  const pts: number[] = []
  for (let f = 0; f <= floors; f++) {
    const y = y0 + f * FLOOR_H
    pts.push(
      -w / 2,
      y,
      -d / 2,
      w / 2,
      y,
      -d / 2,
      w / 2,
      y,
      -d / 2,
      w / 2,
      y,
      d / 2,
      w / 2,
      y,
      d / 2,
      -w / 2,
      y,
      d / 2,
      -w / 2,
      y,
      d / 2,
      -w / 2,
      y,
      -d / 2,
    )
  }
  const cols = Math.round(w / 2.2)
  for (let c = 0; c <= cols; c++) {
    const x = -w / 2 + (w / cols) * c
    pts.push(
      x,
      y0,
      -d / 2,
      x,
      y0 + floors * FLOOR_H,
      -d / 2,
      x,
      y0,
      d / 2,
      x,
      y0 + floors * FLOOR_H,
      d / 2,
    )
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3))
  return g
}

export function TorreYPF({
  centerX,
  centerZ,
  noche,
}: {
  centerX: number
  centerZ: number
  noche: boolean
}) {
  const gridSq = useMemo(() => facadeGrid(SIDE, SIDE, FLOORS, 0), [])
  const triShape = useMemo(() => {
    const s = new THREE.Shape()
    const R = SIDE * 0.72
    s.moveTo(R, 0)
    s.lineTo(-R * 0.5, R * 0.86)
    s.lineTo(-R * 0.5, -R * 0.86)
    s.closePath()
    return s
  }, [])
  const triGeo = useMemo(() => {
    const g = new THREE.ExtrudeGeometry(triShape, { depth: H, bevelEnabled: false })
    g.rotateX(-Math.PI / 2)
    return g
  }, [triShape])
  const cutY = (CUT - 1) * FLOOR_H

  return (
    <group position={[centerX, GROUND, centerZ]} rotation={[0, Math.PI / 4, 0]}>
      {/* PRISMA CUADRADO (Oeste) — dos tramos con hueco en piso 16 */}
      <group position={[-SIDE * 0.26, 0, -SIDE * 0.26]}>
        <mesh position={[0, cutY / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[SIDE, cutY, SIDE]} />
          {facadeMat(noche)}
        </mesh>
        <mesh position={[0, cutY + FLOOR_H + (H - cutY - FLOOR_H) / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[SIDE, H - cutY - FLOOR_H, SIDE]} />
          {facadeMat(noche)}
        </mesh>
        <lineSegments geometry={gridSq}>
          <lineBasicMaterial color={noche ? '#2a4a6b' : '#b6cbde'} transparent opacity={0.3} />
        </lineSegments>
        {/* remate inclinado hacia Oeste */}
        <mesh position={[-SIDE * 0.3, H + 2, 0]} rotation={[0, 0, -0.5]} castShadow>
          <boxGeometry args={[SIDE * 0.5, 6, SIDE]} />
          {facadeMat(noche)}
        </mesh>
      </group>

      {/* PRISMA TRIANGULAR (Este) — abraza al cuadrado */}
      <group position={[SIDE * 0.28, 0, SIDE * 0.28]}>
        <mesh geometry={triGeo} castShadow receiveShadow>
          {facadeMat(noche)}
        </mesh>
        <lineSegments>
          <edgesGeometry args={[triGeo]} />
          <lineBasicMaterial color={noche ? '#2a4a6b' : '#b6cbde'} transparent opacity={0.28} />
        </lineSegments>
        {/* remate inclinado opuesto hacia Este */}
        <mesh position={[SIDE * 0.35, H + 4, 0]} rotation={[0, 0, 0.55]} castShadow>
          <boxGeometry args={[SIDE * 0.55, 7, SIDE * 0.9]} />
          {facadeMat(noche)}
        </mesh>
      </group>

      {/* SKY GARDEN (26–31) */}
      {(() => {
        const y = (26 - 1) * FLOOR_H,
          hh = (31 - 26) * FLOOR_H
        return (
          <group position={[0, y + hh / 2, 0]}>
            <mesh>
              <boxGeometry args={[SIDE * 1.0, hh, SIDE * 1.0]} />
              <meshPhysicalMaterial
                color="#bfe6c8"
                transparent
                opacity={0.3}
                roughness={0.1}
                transmission={0.35}
              />
            </mesh>
            {Array.from({ length: 10 }).map((_, i) => {
              const a = (i / 10) * Math.PI * 2,
                rr = SIDE * 0.3
              return (
                <mesh
                  key={i}
                  position={[Math.cos(a) * rr, -hh / 2 + 2 + (i % 3), Math.sin(a) * rr]}
                >
                  <icosahedronGeometry args={[1.7 + (i % 3) * 0.4, 0]} />
                  <meshStandardMaterial
                    color={SKY_GARDEN_COLORS[i % SKY_GARDEN_COLORS.length]}
                    roughness={0.9}
                  />
                </mesh>
              )
            })}
          </group>
        )
      })()}

      {/* CORONA YPF */}
      <mesh position={[0, H + 8, 0]} castShadow>
        <boxGeometry args={[9, 3, 1]} />
        <meshStandardMaterial
          color="#0424d9"
          emissive="#0b3ad6"
          emissiveIntensity={noche ? 1.8 : 0.7}
        />
      </mesh>

      {/* Basamento conceptual, ubicado en el nivel de suelo local. */}
      <mesh position={[0, 4, 0]} castShadow>
        <boxGeometry args={[SIDE * 1.35, 8, SIDE * 1.35]} />
        <meshPhysicalMaterial
          color={noche ? '#0f2338' : '#a9c6dd'}
          metalness={0.6}
          roughness={0.1}
          transmission={0.3}
          transparent
          opacity={0.7}
        />
      </mesh>
    </group>
  )
}

// ENTORNO fijo: todo apoyado en el suelo, sin río invasivo.
export function Entorno({
  centerX,
  centerZ,
  noche,
}: {
  centerX: number
  centerZ: number
  noche: boolean
}) {
  return (
    <group>
      {/* Suelo urbano grande */}
      <mesh
        position={[centerX, GROUND - 0.1, centerZ]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[1600, 1600]} />
        <meshStandardMaterial color={noche ? '#0a0f18' : '#8b9088'} roughness={1} />
      </mesh>
      {/* Plaza / jardín (anillo verde prolijo) */}
      <mesh position={[centerX, GROUND, centerZ]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <ringGeometry args={[42, 95, 64]} />
        <meshStandardMaterial color={noche ? '#14331d' : '#4a8a4d'} roughness={0.95} />
      </mesh>
      {/* Vereda perimetral clara */}
      <mesh position={[centerX, GROUND + 0.02, centerZ]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[38, 42, 64]} />
        <meshStandardMaterial color="#c8ccc6" roughness={0.9} />
      </mesh>
      {/* Calle Macacha (Oeste), delgada y lejana */}
      <mesh position={[centerX - 78, GROUND + 0.03, centerZ]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[22, 700]} />
        <meshStandardMaterial color="#2b2f36" roughness={0.9} />
      </mesh>
      {/* Dársena chica y lejana al Este (no un mar) */}
      <mesh position={[centerX + 150, GROUND + 0.04, centerZ]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[60, 380]} />
        <meshPhysicalMaterial
          color={noche ? '#0a2036' : '#3a6a86'}
          roughness={0.12}
          metalness={0.5}
        />
      </mesh>
      {/* Árboles del parque (bien apoyados) */}
      {Array.from({ length: 34 }).map((_, i) => {
        const a = (i / 34) * Math.PI * 2,
          rr = 52 + (i % 4) * 9
        const x = centerX + Math.cos(a) * rr,
          z = centerZ + Math.sin(a) * rr
        return (
          <group key={i} position={[x, GROUND, z]}>
            <mesh position={[0, 2, 0]} castShadow>
              <cylinderGeometry args={[0.3, 0.42, 4, 6]} />
              <meshStandardMaterial color="#5a3f28" />
            </mesh>
            <mesh position={[0, 5.2, 0]} castShadow>
              <icosahedronGeometry args={[2.6, 0]} />
              <meshStandardMaterial color={TREE_COLORS[i % TREE_COLORS.length]} roughness={0.9} />
            </mesh>
          </group>
        )
      })}
      {/* Torres vecinas — BASE en el suelo (antes flotaban) */}
      {NEIGHBOR_BUILDINGS.map(([dx, hh, dz], i) => (
        <mesh key={i} position={[centerX + dx, GROUND + hh, centerZ + dz]} castShadow receiveShadow>
          <boxGeometry args={[24, hh * 2, 24]} />
          <meshStandardMaterial
            color={noche ? '#101a2c' : '#9fb4c8'}
            metalness={0.7}
            roughness={0.18}
          />
        </mesh>
      ))}
    </group>
  )
}
