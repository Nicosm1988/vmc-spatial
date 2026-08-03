// ============================================================================
// Escena 3D REALISTA con React Three Fiber + Drei.
// - Piso extruido desde el contorno de la lente (Torre Pelli).
// - Estaciones de trabajo reales (escritorio + monitor + silla) por puesto.
// - Video walls emisivos, salas vidriadas, mesa de troubleshooting.
// - Environment con Lightformers (reflejos PBR, 100% offline) + ContactShadows.
// Todo se deriva del mismo documento JSON (data-driven).
// ============================================================================
import { useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import {
  OrbitControls, Environment, Lightformer, ContactShadows, RoundedBox, Edges,
} from '@react-three/drei'
import * as THREE from 'three'
import type { InsightKey, Point, VmcDocument, Zone } from '../types'
import { toM, packDesks, center, heat } from '../lib/geometry'
import { INSIGHTS } from '../lib/insights'
import { Workstation, VideoWallMesh, Table, Chair } from './Furniture'

interface Props {
  doc: VmcDocument
  selectedId: string | null
  insight: InsightKey
  noche: boolean
  techo: boolean
  onSelect: (id: string | null) => void
}

// Geometría del piso (lente) extruida, memoizada.
function useFloorGeo(plate: Point[]) {
  return useMemo(() => {
    const s = new THREE.Shape()
    plate.forEach((p, i) => {
      const x = toM(p.x), z = toM(p.y)
      if (i === 0) s.moveTo(x, z); else s.lineTo(x, z)
    })
    s.closePath()
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.3, bevelEnabled: false })
    g.rotateX(Math.PI / 2)
    return g
  }, [plate])
}

function cursor(on: boolean) {
  document.body.style.cursor = on ? 'pointer' : 'auto'
}

// Un cluster: pad translúcido + puestos (estaciones de trabajo).
function Cluster({
  z, plate, cx, cz, fill, selected, onSelect,
}: {
  z: Zone; plate: Point[]; cx: number; cz: number
  fill: string; selected: boolean; onSelect: (id: string) => void
}) {
  const x = toM(z.x), zz = toM(z.y), w = toM(z.w), h = toM(z.h)
  const px = x + w / 2, pz = zz + h / 2
  const desks = packDesks(z, z.puestos, plate)
  return (
    <group>
      {/* Pad del cluster */}
      <RoundedBox
        args={[w, 0.05, h]} radius={0.05} smoothness={2} position={[px, 0.03, pz]}
        onClick={(e) => { e.stopPropagation(); onSelect(z.id) }}
        onPointerOver={(e) => { e.stopPropagation(); cursor(true) }}
        onPointerOut={() => cursor(false)}
      >
        <meshStandardMaterial color={fill} roughness={0.5} metalness={0.1} transparent opacity={0.42} />
        {selected && <Edges color="#ffd166" />}
      </RoundedBox>
      {/* Estaciones de trabajo, orientadas hacia el núcleo */}
      {desks.map((d, i) => {
        const dx = toM(d.x), dz = toM(d.y)
        const rot = Math.atan2(cz - dz, cx - dx) - Math.PI / 2
        return <Workstation key={i} x={dx} z={dz} rot={rot} screen={fill} />
      })}
    </group>
  )
}

export default function Scene3D({ doc, selectedId, insight, noche, techo, onSelect }: Props) {
  const floorGeo = useFloorGeo(doc.plate)
  const cx = toM(doc.ancho) / 2
  const cz = toM(doc.alto) / 2
  const insightDef = INSIGHTS[insight]

  const bg = noche ? '#03060f' : '#060c1c'

  return (
    <Canvas
      shadows
      dpr={[1, 1.75]}
      camera={{ position: [cx, 44, cz + 58], fov: 45 }}
      gl={{ antialias: true }}
    >
      <color attach="background" args={[bg]} />
      <fog attach="fog" args={[bg, 70, 190]} />

      {/* Luz ambiente + key con sombra */}
      <ambientLight intensity={noche ? 0.28 : 0.6} />
      <directionalLight
        position={[cx - 26, 42, cz - 16]}
        intensity={noche ? 0.5 : 1.15}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      >
        <orthographicCamera attach="shadow-camera" args={[-45, 45, 45, -45, 0.1, 160]} />
      </directionalLight>

      {/* Piso (lente) */}
      <mesh geometry={floorGeo} position={[0, -0.02, 0]} receiveShadow onClick={() => onSelect(null)}>
        <meshStandardMaterial color="#0a1836" roughness={0.85} metalness={0.12} />
      </mesh>
      {/* Zócalo luminoso del contorno */}
      <mesh geometry={floorGeo} position={[0, 0, 0]}>
        <meshBasicMaterial color="#03c1bd" wireframe transparent opacity={0.12} />
      </mesh>

      {/* Clusters con estaciones de trabajo */}
      {doc.zonas
        .filter((z) => z.kind === 'cluster')
        .map((z) => {
          const fill = insight === 'none' ? z.color : heat(insightDef.value(z))
          return (
            <Cluster
              key={z.id} z={z} plate={doc.plate} cx={cx} cz={cz}
              fill={fill} selected={z.id === selectedId} onSelect={onSelect}
            />
          )
        })}

      {/* Núcleo: plataforma central */}
      {doc.zonas.filter((z) => z.kind === 'nucleo').map((z) => {
        const x = toM(z.x), zz = toM(z.y), w = toM(z.w), h = toM(z.h)
        return (
          <group key={z.id}>
            <RoundedBox
              args={[w, 0.25, h]} radius={0.06} smoothness={2} position={[x + w / 2, 0.12, zz + h / 2]}
              onClick={(e) => { e.stopPropagation(); onSelect(z.id) }}
              onPointerOver={(e) => { e.stopPropagation(); cursor(true) }}
              onPointerOut={() => cursor(false)}
            >
              <meshStandardMaterial color="#0a1636" roughness={0.6} metalness={0.25} />
              {z.id === selectedId && <Edges color="#ffd166" />}
            </RoundedBox>
          </group>
        )
      })}

      {/* Video walls */}
      {doc.videoWalls.map((v) => {
        const x1 = toM(v.x1), y1 = toM(v.y1), x2 = toM(v.x2), y2 = toM(v.y2)
        const len = Math.hypot(x2 - x1, y2 - y1)
        const angle = Math.atan2(y2 - y1, x2 - x1)
        return (
          <VideoWallMesh key={v.id} x={(x1 + x2) / 2} z={(y1 + y2) / 2} len={len} angle={angle} night={noche} />
        )
      })}

      {/* Mesa de troubleshooting + sillas */}
      {doc.zonas.filter((z) => z.kind === 'troubleshooting').map((z) => {
        const { cx: mcx, cy: mcy } = center(z)
        const tx = toM(mcx), tz = toM(mcy), w = toM(z.w) * 0.7, d = toM(z.h) * 0.7
        return (
          <group key={z.id}
            onClick={(e) => { e.stopPropagation(); onSelect(z.id) }}
            onPointerOver={(e) => { e.stopPropagation(); cursor(true) }}
            onPointerOut={() => cursor(false)}
          >
            <Table x={tx} z={tz} w={w} d={d} color={z.color} />
            <Chair x={tx - w / 2 - 0.4} z={tz} rot={Math.PI / 2} />
            <Chair x={tx + w / 2 + 0.4} z={tz} rot={-Math.PI / 2} />
          </group>
        )
      })}

      {/* Salas de reunión: caja vidriada + mesa + sillas */}
      {doc.zonas.filter((z) => z.kind === 'sala').map((z) => {
        const x = toM(z.x), zz = toM(z.y), w = toM(z.w), h = toM(z.h)
        const rcx = x + w / 2, rcz = zz + h / 2
        return (
          <group key={z.id}
            onClick={(e) => { e.stopPropagation(); onSelect(z.id) }}
            onPointerOver={(e) => { e.stopPropagation(); cursor(true) }}
            onPointerOut={() => cursor(false)}
          >
            {/* Vidrio */}
            <mesh position={[rcx, 1.35, rcz]}>
              <boxGeometry args={[w, 2.7, h]} />
              <meshStandardMaterial color="#8fd6ff" transparent opacity={0.14} roughness={0.1} metalness={0.2} />
              {z.id === selectedId && <Edges color="#ffd166" />}
            </mesh>
            <Table x={rcx} z={rcz} w={w * 0.5} d={h * 0.45} color="#2a3350" />
            <Chair x={rcx - w * 0.28} z={rcz} rot={Math.PI / 2} />
            <Chair x={rcx + w * 0.28} z={rcz} rot={-Math.PI / 2} />
          </group>
        )
      })}

      {/* Techo opcional */}
      {techo && (
        <mesh geometry={floorGeo} position={[0, toM(doc.alturaLibre), 0]}>
          <meshStandardMaterial color="#0e1c3c" transparent opacity={0.18} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* Sombras de contacto suaves (grounding realista) */}
      <ContactShadows
        position={[cx, 0.04, cz]} scale={90} blur={2.6} opacity={0.5} far={30}
        resolution={1024} color="#02040a"
      />

      {/* Entorno de reflejos construido con Lightformers (sin archivos externos) */}
      <Environment resolution={256}>
        <Lightformer intensity={noche ? 0.5 : 1.3} position={[0, 12, 0]} scale={[24, 24, 1]} rotation-x={Math.PI / 2} />
        <Lightformer intensity={0.7} position={[14, 6, -12]} scale={[10, 10, 1]} color="#ffffff" />
        <Lightformer intensity={0.7} position={[-14, 6, 12]} scale={[10, 10, 1]} color="#27e0ff" />
        <Lightformer intensity={0.5} position={[0, 6, 18]} scale={[14, 6, 1]} color="#0424d9" />
      </Environment>

      <OrbitControls
        target={[cx, 0, cz]}
        enableDamping dampingFactor={0.08}
        maxPolarAngle={Math.PI / 2.15}
        minDistance={18} maxDistance={150}
      />
    </Canvas>
  )
}
