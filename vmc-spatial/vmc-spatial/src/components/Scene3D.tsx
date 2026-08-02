// ============================================================================
// Escena 3D procedural con Three.js "puro" (sin R3F, menos riesgo de versiones).
// Extruye cada zona a un volumen, ubica los video walls y los hot desks.
// Se re-construye cuando cambia el documento, el insight o el selectedId.
// ============================================================================
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import type { InsightKey, VmcDocument } from '../types'
import { toM, packDesks, heat } from '../lib/geometry'
import { INSIGHTS } from '../lib/insights'

interface Props {
  doc: VmcDocument
  selectedId: string | null
  insight: InsightKey
  noche: boolean
  techo: boolean
  onSelect: (id: string | null) => void
}

export default function Scene3D({ doc, selectedId, insight, noche, techo, onSelect }: Props) {
  const mountRef = useRef<HTMLDivElement | null>(null)
  // Guardamos referencias mutables para no recrear renderer en cada cambio.
  const ctx = useRef<any>(null)

  // --- Montaje único: renderer, cámara, controles, luces, loop ---
  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x060b1a)

    const camera = new THREE.PerspectiveCamera(
      50,
      mount.clientWidth / mount.clientHeight,
      0.1,
      2000,
    )
    const W = toM(doc.ancho)
    const H = toM(doc.alto)
    camera.position.set(W * 0.5, Math.max(W, H) * 0.85, H * 1.25)

    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
    } catch (e) {
      // Fallback: si no hay WebGL, avisamos en el div.
      mount.innerHTML =
        '<div style="padding:24px;color:#9fb0d4;font-size:14px">Tu navegador no soporta WebGL. Usá la vista 2D.</div>'
      return
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75))
    renderer.setSize(mount.clientWidth, mount.clientHeight)
    renderer.shadowMap.enabled = true
    mount.appendChild(renderer.domElement)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.08
    controls.target.set(W * 0.5, 0, H * 0.5)

    const raycaster = new THREE.Raycaster()
    const pointer = new THREE.Vector2()

    const world = new THREE.Group()
    scene.add(world)

    // Loop de render "on demand" simplificado (rAF continuo pero liviano).
    let raf = 0
    const animate = () => {
      controls.update()
      renderer.render(scene, camera)
      raf = requestAnimationFrame(animate)
    }
    animate()

    // Resize.
    const onResize = () => {
      if (!mount) return
      camera.aspect = mount.clientWidth / mount.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(mount.clientWidth, mount.clientHeight)
    }
    window.addEventListener('resize', onResize)

    // Click / picking.
    const onClick = (ev: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect()
      pointer.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1
      pointer.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1
      raycaster.setFromCamera(pointer, camera)
      const hits = raycaster.intersectObjects(world.children, true)
      const hit = hits.find((h) => (h.object as any).userData?.zoneId)
      if (hit) onSelect((hit.object as any).userData.zoneId)
      else onSelect(null)
    }
    renderer.domElement.addEventListener('click', onClick)

    ctx.current = { scene, camera, renderer, controls, world, mount }

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
      renderer.domElement.removeEventListener('click', onClick)
      controls.dispose()
      renderer.dispose()
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement)
      ctx.current = null
    }
    // Solo se monta una vez; los cambios de contenido van en el efecto de abajo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // --- Reconstrucción del contenido (zonas, luces, insights, selección) ---
  useEffect(() => {
    const c = ctx.current
    if (!c) return
    const { scene, world } = c

    // Limpiar mundo.
    while (world.children.length) world.remove(world.children[0])
    // Quitar luces previas.
    scene.children
      .filter((o: any) => o.isLight)
      .forEach((l: any) => scene.remove(l))

    const insightDef = INSIGHTS[insight]

    // Piso base.
    const W = toM(doc.ancho)
    const H = toM(doc.alto)
    const floorGeo = new THREE.BoxGeometry(W, 0.15, H)
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x0a1430, roughness: 0.9 })
    const floor = new THREE.Mesh(floorGeo, floorMat)
    floor.position.set(W / 2, -0.075, H / 2)
    floor.receiveShadow = true
    world.add(floor)

    // Zonas extruidas.
    doc.zonas.forEach((z) => {
      if (z.w <= 0 || z.h <= 0) return
      const zw = toM(z.w)
      const zh = toM(z.h)
      const zx = toM(z.x)
      const zy = toM(z.y)
      let height =
        z.kind === 'nucleo' ? 0.6 :
        z.kind === 'sala' ? 1.4 :
        z.kind === 'troubleshooting' ? 0.9 : 0.5
      const colHex =
        insight === 'none' ? z.color : heat(insightDef.value(z))
      const isSel = z.id === selectedId
      const mat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(colHex),
        roughness: 0.65,
        metalness: 0.1,
        emissive: new THREE.Color(isSel ? 0x3a2a00 : 0x000000),
        transparent: true,
        opacity: 0.92,
      })
      const geo = new THREE.BoxGeometry(zw, height, zh)
      const mesh = new THREE.Mesh(geo, mat)
      mesh.position.set(zx + zw / 2, height / 2, zy + zh / 2)
      mesh.castShadow = true
      mesh.receiveShadow = true
      ;(mesh as any).userData = { zoneId: z.id }
      world.add(mesh)

      // Contorno de selección.
      if (isSel) {
        const edges = new THREE.EdgesGeometry(geo)
        const line = new THREE.LineSegments(
          edges,
          new THREE.LineBasicMaterial({ color: 0xffb020 }),
        )
        line.position.copy(mesh.position)
        world.add(line)
      }

      // Hot desks como cubitos.
      if (z.puestos > 0) {
        const deskGeo = new THREE.BoxGeometry(1.2, 0.75, 0.7)
        const deskMat = new THREE.MeshStandardMaterial({ color: 0x0c1a38, roughness: 0.8 })
        packDesks(z, z.puestos).forEach((p) => {
          const d = new THREE.Mesh(deskGeo, deskMat)
          d.position.set(toM(p.x), height + 0.38, toM(p.y))
          d.castShadow = true
          ;(d as any).userData = { zoneId: z.id }
          world.add(d)
        })
      }
    })

    // Video walls verticales (paneles).
    doc.videoWalls.forEach((v) => {
      const x1 = toM(v.x1), y1 = toM(v.y1), x2 = toM(v.x2), y2 = toM(v.y2)
      const len = Math.hypot(x2 - x1, y2 - y1)
      const panel = new THREE.Mesh(
        new THREE.BoxGeometry(len, 2.4, 0.15),
        new THREE.MeshStandardMaterial({
          color: 0x0a2540,
          emissive: new THREE.Color(0x1782c8),
          emissiveIntensity: noche ? 1.2 : 0.5,
          roughness: 0.3,
        }),
      )
      const mx = (x1 + x2) / 2, my = (y1 + y2) / 2
      panel.position.set(mx, 1.3, my)
      const angle = Math.atan2(y2 - y1, x2 - x1)
      panel.rotation.y = -angle
      world.add(panel)
    })

    // Techo opcional (semitransparente).
    if (techo) {
      const roof = new THREE.Mesh(
        new THREE.BoxGeometry(W, 0.1, H),
        new THREE.MeshStandardMaterial({ color: 0x0e1c3c, transparent: true, opacity: 0.25, side: THREE.DoubleSide }),
      )
      roof.position.set(W / 2, toM(doc.alturaLibre), H / 2)
      world.add(roof)
    }

    // Iluminación día / noche.
    const amb = new THREE.AmbientLight(0xffffff, noche ? 0.35 : 0.7)
    scene.add(amb)
    const key = new THREE.DirectionalLight(0xffffff, noche ? 0.6 : 1.1)
    key.position.set(W * 0.3, 40, H * 0.1)
    key.castShadow = true
    key.shadow.mapSize.set(1024, 1024)
    key.shadow.camera.far = 200
    scene.add(key)
    const fill = new THREE.DirectionalLight(0x88aaff, noche ? 0.5 : 0.4)
    fill.position.set(W * 0.8, 25, H * 0.9)
    scene.add(fill)
  }, [doc, selectedId, insight, noche, techo])

  return <div ref={mountRef} className="scene-canvas" />
}
