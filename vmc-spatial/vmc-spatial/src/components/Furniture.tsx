// ============================================================================
// Muebles realistas (React Three Fiber + Drei). Se construyen con RoundedBox +
// cilindros y materiales PBR (roughness/metalness). El realismo lo aportan los
// materiales + el Environment (reflejos) + ContactShadows definidos en Scene3D.
// Medidas en METROS (el documento está en mm; Scene3D convierte con toM()).
// ============================================================================
import { RoundedBox } from '@react-three/drei'

// ---- Estación de trabajo: escritorio + monitor + silla ----
export function Workstation({
  x, z, rot = 0, screen = '#0e2a52',
}: { x: number; z: number; rot?: number; screen?: string }) {
  return (
    <group position={[x, 0, z]} rotation={[0, rot, 0]}>
      {/* Tapa del escritorio */}
      <RoundedBox args={[1.5, 0.05, 0.8]} radius={0.02} smoothness={3} position={[0, 0.73, 0]}>
        <meshStandardMaterial color="#d9dce4" roughness={0.55} metalness={0.05} />
      </RoundedBox>
      {/* Faldón / patas */}
      <mesh position={[0, 0.36, 0.02]}>
        <boxGeometry args={[1.42, 0.72, 0.03]} />
        <meshStandardMaterial color="#2b303c" roughness={0.6} metalness={0.35} />
      </mesh>
      <mesh position={[-0.66, 0.36, 0]}>
        <boxGeometry args={[0.04, 0.72, 0.72]} />
        <meshStandardMaterial color="#2b303c" roughness={0.6} metalness={0.35} />
      </mesh>
      <mesh position={[0.66, 0.36, 0]}>
        <boxGeometry args={[0.04, 0.72, 0.72]} />
        <meshStandardMaterial color="#2b303c" roughness={0.6} metalness={0.35} />
      </mesh>
      {/* Monitor: pie, brazo y pantalla */}
      <mesh position={[0, 0.79, -0.28]}>
        <cylinderGeometry args={[0.12, 0.14, 0.02, 16]} />
        <meshStandardMaterial color="#1b1f28" roughness={0.5} metalness={0.4} />
      </mesh>
      <mesh position={[0, 0.9, -0.28]}>
        <boxGeometry args={[0.05, 0.22, 0.05]} />
        <meshStandardMaterial color="#1b1f28" roughness={0.5} metalness={0.4} />
      </mesh>
      <RoundedBox args={[0.66, 0.4, 0.035]} radius={0.015} smoothness={2} position={[0, 1.05, -0.3]}>
        <meshStandardMaterial color="#0b0f1a" roughness={0.35} metalness={0.2} />
      </RoundedBox>
      {/* Pantalla emisiva */}
      <mesh position={[0, 1.05, -0.281]}>
        <planeGeometry args={[0.6, 0.34]} />
        <meshStandardMaterial color={screen} emissive={screen} emissiveIntensity={0.85} roughness={0.25} />
      </mesh>
      {/* Silla */}
      <Chair x={0} z={0.62} rot={Math.PI} />
    </group>
  )
}

// ---- Silla de oficina ----
export function Chair({ x, z, rot = 0 }: { x: number; z: number; rot?: number }) {
  return (
    <group position={[x, 0, z]} rotation={[0, rot, 0]}>
      <RoundedBox args={[0.5, 0.08, 0.5]} radius={0.03} smoothness={2} position={[0, 0.46, 0]}>
        <meshStandardMaterial color="#132845" roughness={0.7} metalness={0.1} />
      </RoundedBox>
      <RoundedBox args={[0.5, 0.5, 0.08]} radius={0.04} smoothness={2} position={[0, 0.74, -0.22]}>
        <meshStandardMaterial color="#132845" roughness={0.7} metalness={0.1} />
      </RoundedBox>
      <mesh position={[0, 0.24, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 0.42, 10]} />
        <meshStandardMaterial color="#20242e" roughness={0.4} metalness={0.7} />
      </mesh>
      <mesh position={[0, 0.04, 0]}>
        <cylinderGeometry args={[0.3, 0.3, 0.04, 5]} />
        <meshStandardMaterial color="#20242e" roughness={0.4} metalness={0.7} />
      </mesh>
    </group>
  )
}

// ---- Video wall: marco + pantalla emisiva ----
export function VideoWallMesh({
  x, z, len, angle, night,
}: { x: number; z: number; len: number; angle: number; night: boolean }) {
  return (
    <group position={[x, 1.5, z]} rotation={[0, -angle, 0]}>
      <RoundedBox args={[len, 2.5, 0.12]} radius={0.03} smoothness={2}>
        <meshStandardMaterial color="#0a1220" roughness={0.5} metalness={0.4} />
      </RoundedBox>
      <mesh position={[0, 0, 0.07]}>
        <planeGeometry args={[len - 0.2, 2.2]} />
        <meshStandardMaterial color="#0a2a52" emissive="#1c86d6" emissiveIntensity={night ? 1.5 : 0.7} roughness={0.25} />
      </mesh>
    </group>
  )
}

// ---- Mesa genérica (troubleshooting / salas) ----
export function Table({
  x, z, w, d, color = '#c9611f', h = 0.74,
}: { x: number; z: number; w: number; d: number; color?: string; h?: number }) {
  return (
    <group position={[x, 0, z]}>
      <RoundedBox args={[w, 0.06, d]} radius={0.03} smoothness={3} position={[0, h, 0]}>
        <meshStandardMaterial color={color} roughness={0.4} metalness={0.15} />
      </RoundedBox>
      <mesh position={[0, h / 2, 0]}>
        <boxGeometry args={[w * 0.85, h, d * 0.7]} />
        <meshStandardMaterial color="#20242e" roughness={0.6} metalness={0.3} />
      </mesh>
    </group>
  )
}
