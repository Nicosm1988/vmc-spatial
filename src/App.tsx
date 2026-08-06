import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import type { AppMode, InsightKey, ViewKind, VmcDocument, Zone, ZoneKind } from './types'
import { VIDEO_WALL_CORE_EDGE, VMC_PISO_16 } from './data/vmcPiso16'
import { INSIGHT_ORDER, INSIGHTS } from './lib/insights'
import { clearDoc, exportJson, importJson, loadDoc, saveDoc } from './lib/persistence'
import Plan2D from './components/Plan2D'
import Structure from './components/Structure'
import Inspector from './components/Inspector'
import InsightsLegend from './components/InsightsLegend'
import Palette from './components/Palette'
import CameraPanel from './components/CameraPanel'
import type { CamApi } from './scene/cameraTypes'
import { readDeviceHints, resolveQuality } from './scene/qualityProfiles'
import { useExperienceStore } from './state/useExperienceStore'
import ExperienceNav from './ui/ExperienceNav'
import QualitySelector from './ui/QualitySelector'
import SceneErrorBoundary from './ui/SceneErrorBoundary'
import SceneLoadingOverlay from './ui/SceneLoadingOverlay'
import TransitionStatus from './ui/TransitionStatus'
import WebGLFallback from './ui/WebGLFallback'
import { supportsWebGL } from './lib/webgl'

const Scene3D = lazy(() => import('./components/Scene3D'))

function normalizeWalls(document: VmcDocument): VmcDocument {
  const canonicalWallIds = new Set(Object.keys(VIDEO_WALL_CORE_EDGE))
  const isVmcPiso16 =
    document.nombre === VMC_PISO_16.nombre ||
    document.piso.includes('Torre YPF') ||
    document.videoWalls.some((wall) => canonicalWallIds.has(wall.id))

  if (!isVmcPiso16) return document

  const core =
    document.core.length === VMC_PISO_16.core.length
      ? document.core
      : structuredClone(VMC_PISO_16.core)
  const requiredOffice = VMC_PISO_16.zonas.find((zone) => zone.id === 'of-central')
  const zonesWithoutSupersededTipTables = document.zonas.filter(
    (zone) => zone.id !== 'com-e1' && zone.id !== 'com-e2',
  )
  const zonas =
    requiredOffice && !zonesWithoutSupersededTipTables.some((zone) => zone.id === requiredOffice.id)
      ? [...zonesWithoutSupersededTipTables, structuredClone(requiredOffice)]
      : zonesWithoutSupersededTipTables

  return {
    ...document,
    core,
    zonas,
    videoWalls: VMC_PISO_16.videoWalls.map((requiredWall) => {
      const existing = document.videoWalls.find((wall) => wall.id === requiredWall.id)
      const edgeIndex = VIDEO_WALL_CORE_EDGE[requiredWall.id as keyof typeof VIDEO_WALL_CORE_EDGE]
      const start = core[edgeIndex]!
      const end = core[(edgeIndex + 1) % core.length]!
      return {
        ...requiredWall,
        x1: start.x,
        y1: start.y,
        x2: end.x,
        y2: end.y,
        nombre: existing?.nombre ?? requiredWall.nombre,
        flip: true,
      }
    }),
  }
}

const freshPreset = (): VmcDocument => normalizeWalls(structuredClone(VMC_PISO_16))

let sequence = 1

function newZone(kind: ZoneKind, centerX: number, centerY: number): Zone {
  const id = `${kind}-${Date.now()}-${sequence++}`
  const base = {
    id,
    cx: centerX,
    cy: centerY,
    color: '#1f8fff',
    puestos: 0,
    ocupacion: 60,
    datalizacion: 40,
    nota: 'Objeto demostrativo.',
  }
  if (kind === 'bench') {
    return {
      ...base,
      nombre: 'Isla nueva',
      kind,
      rot: 0,
      pairs: 3,
      puestos: 6,
    }
  }
  if (kind === 'circular') {
    return { ...base, nombre: 'Mesa redonda', kind, r: 1650, color: '#2f6f7a' }
  }
  if (kind === 'comedor') {
    return {
      ...base,
      nombre: 'Comedor',
      kind,
      rot: 0,
      w: 3600,
      h: 1600,
      color: '#8a5a2b',
    }
  }
  if (kind === 'oficina') {
    return {
      ...base,
      nombre: 'Oficina',
      kind,
      rot: 0,
      w: 3800,
      h: 2600,
      puestos: 1,
      color: '#2a4a86',
    }
  }
  return { ...base, nombre: 'Núcleo', kind }
}

export default function App() {
  const [doc, setDoc] = useState<VmcDocument>(() => normalizeWalls(loadDoc() || freshPreset()))
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [mode, setMode] = useState<AppMode>('explorar')
  const [view, setView] = useState<ViewKind>('3d')
  const [insight, setInsight] = useState<InsightKey>('none')
  const [roof, setRoof] = useState(true)
  const [snap, setSnap] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [webGLAvailable] = useState(supportsWebGL)
  const fileRef = useRef<HTMLInputElement | null>(null)
  const camApi = useRef<CamApi>({})
  const toastTimer = useRef<number | null>(null)

  const stage = useExperienceStore((state) => state.stage)
  const night = useExperienceStore((state) => state.night)
  const toggleNight = useExperienceStore((state) => state.toggleNight)
  const qualityPreference = useExperienceStore((state) => state.qualityPreference)
  const setResolvedQuality = useExperienceStore((state) => state.setResolvedQuality)
  const setReducedMotion = useExperienceStore((state) => state.setReducedMotion)
  const cancelTransition = useExperienceStore((state) => state.cancelTransition)
  const enterInterior = useExperienceStore((state) => state.enterInterior)

  const editing = mode !== 'explorar'
  const showPanels = editing || view === '2d'
  const selectedZone = doc.zonas.find((zone) => zone.id === selectedId) || null
  const selectedWall = doc.videoWalls.find((wall) => wall.id === selectedId) || null

  useEffect(() => {
    const timeout = window.setTimeout(() => saveDoc(doc), 700)
    return () => window.clearTimeout(timeout)
  }, [doc])

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const resolve = () => {
      setReducedMotion(media.matches)
      setResolvedQuality(resolveQuality(qualityPreference, readDeviceHints()))
    }
    resolve()
    media.addEventListener('change', resolve)
    return () => media.removeEventListener('change', resolve)
  }, [qualityPreference, setReducedMotion, setResolvedQuality])

  useEffect(() => {
    function onEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') cancelTransition()
    }
    window.addEventListener('keydown', onEscape)
    return () => window.removeEventListener('keydown', onEscape)
  }, [cancelTransition])

  useEffect(
    () => () => {
      if (toastTimer.current) window.clearTimeout(toastTimer.current)
    },
    [],
  )

  function flash(message: string) {
    setToast(message)
    if (toastTimer.current) window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(null), 2200)
  }

  function patchZone(id: string, patch: Partial<Zone>) {
    setDoc((current) => ({
      ...current,
      actualizado: new Date().toISOString(),
      zonas: current.zonas.map((zone) => (zone.id === id ? { ...zone, ...patch } : zone)),
    }))
  }

  function moveAny(id: string, centerXmm: number, centerYmm: number) {
    if (doc.videoWalls.some((wall) => wall.id === id)) return
    patchZone(id, { cx: centerXmm, cy: centerYmm })
  }

  function addZone(kind: ZoneKind) {
    const zone = newZone(kind, 12000, 20000)
    setDoc((current) => ({ ...current, zonas: [...current.zonas, zone] }))
    setSelectedId(zone.id)
    flash('Objeto agregado')
  }

  function deleteSelection() {
    if (!selectedId) return
    if (selectedWall) {
      flash('Las paredes de pantallas y la puerta son estructura fija')
      return
    }
    setDoc((current) => ({
      ...current,
      zonas: current.zonas.filter((zone) => zone.id !== selectedId),
    }))
    setSelectedId(null)
    flash('Objeto eliminado')
  }

  function duplicateSelection() {
    if (!selectedZone) return
    const copy: Zone = {
      ...selectedZone,
      id: `${selectedZone.kind}-${Date.now()}-${sequence++}`,
      cx: selectedZone.cx + 2500,
      cy: selectedZone.cy + 1500,
      nombre: `${selectedZone.nombre} (copia)`,
    }
    setDoc((current) => ({ ...current, zonas: [...current.zonas, copy] }))
    setSelectedId(copy.id)
    flash('Objeto duplicado')
  }

  function rotateSelection(degrees: number) {
    if (selectedZone) {
      patchZone(selectedZone.id, {
        rot: (selectedZone.rot || 0) + (degrees * Math.PI) / 180,
      })
    }
  }

  function resetPreset() {
    if (
      !window.confirm('¿Restablecer la distribución demostrativa? Se perderán los cambios locales.')
    ) {
      return
    }
    setDoc(freshPreset())
    setSelectedId(null)
    clearDoc()
    flash('Distribución restablecida')
  }

  async function onImportFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      const imported = await importJson(file)
      setDoc(normalizeWalls(imported))
      setSelectedId(null)
      flash('Configuración importada')
    } catch (error: unknown) {
      flash(error instanceof Error ? error.message : 'No se pudo importar')
    } finally {
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  useEffect(() => {
    function onDelete(event: KeyboardEvent) {
      if (!editing || !selectedId) return
      const target = event.target as HTMLElement | null
      if (
        (event.key === 'Delete' || event.key === 'Backspace') &&
        !target?.matches('input, textarea, select')
      ) {
        deleteSelection()
      }
    }
    window.addEventListener('keydown', onDelete)
    return () => window.removeEventListener('keydown', onDelete)
  })

  const selectedName = selectedWall ? selectedWall.nombre : selectedZone ? selectedZone.nombre : ''
  const canEditSelection = Boolean(selectedZone && selectedZone.kind !== 'nucleo')

  function setAppMode(nextMode: AppMode) {
    setMode(nextMode)
    if (nextMode === 'editar3d') {
      setView('3d')
      if (stage !== 'interior') enterInterior()
    }
    if (nextMode === 'editar2d') {
      cancelTransition()
      setView('2d')
    }
  }

  function openPlan() {
    cancelTransition()
    setView('2d')
    if (mode === 'editar3d') setMode('editar2d')
  }

  return (
    <div className={`app ${showPanels ? 'app--panels' : 'app--immersive'}`}>
      <header className="topbar">
        <div className="brand" aria-label="VMC Spatial Studio">
          <span className="brand-mark" aria-hidden="true">
            <i />
            <i />
          </span>
          <span className="brand-copy">
            <strong>VMC Spatial</strong>
            <small>Studio · Piso 16</small>
          </span>
        </div>

        <div className="topbar__center">
          <div className="seg" aria-label="Modo de aplicación">
            {(['explorar', 'editar2d', 'editar3d'] as AppMode[]).map((item) => (
              <button
                key={item}
                className={mode === item ? 'active' : ''}
                onClick={() => setAppMode(item)}
              >
                {item === 'explorar'
                  ? 'Presentación'
                  : item === 'editar2d'
                    ? 'Editar 2D'
                    : 'Editar 3D'}
              </button>
            ))}
          </div>
          <div className="seg view-switch" aria-label="Selector de vista">
            <button className={view === '2d' ? 'active' : ''} onClick={openPlan}>
              Plano
            </button>
            <button className={view === '3d' ? 'active' : ''} onClick={() => setView('3d')}>
              Espacio 3D
            </button>
          </div>
        </div>

        <div className="topbar__actions">
          {view === '3d' ? <QualitySelector /> : null}
          <button className="icon-action" onClick={toggleNight} aria-label="Alternar día y noche">
            {night ? 'Noche' : 'Día'}
          </button>
          {view === '3d' ? (
            <button className={roof ? 'active' : ''} onClick={() => setRoof((value) => !value)}>
              Techo
            </button>
          ) : null}
          <details className="more-menu">
            <summary>Archivo</summary>
            <div>
              <button onClick={() => exportJson(doc)}>Exportar JSON</button>
              <button onClick={() => fileRef.current?.click()}>Importar JSON</button>
              <button className="danger" onClick={resetPreset}>
                Restablecer
              </button>
            </div>
          </details>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={onImportFile}
          />
        </div>
      </header>

      {showPanels ? (
        <aside className="side side--left">
          {editing ? <Palette onAdd={addZone} /> : null}
          <Structure doc={doc} selectedId={selectedId} onSelect={setSelectedId} />
        </aside>
      ) : null}

      <main className="stage">
        {view === '3d' ? (
          <ExperienceNav ensure3D={() => setView('3d')} reframe={() => camApi.current.reset?.()} />
        ) : null}
        {view === '2d' ? (
          <Plan2D
            key={`${doc.ancho}-${doc.alto}`}
            doc={doc}
            selectedId={selectedId}
            insight={insight}
            editing={editing}
            snap={snap}
            onSelect={setSelectedId}
            onMove={moveAny}
          />
        ) : !webGLAvailable ? (
          <WebGLFallback openPlan={openPlan} />
        ) : (
          <SceneErrorBoundary openPlan={openPlan}>
            <Suspense fallback={<SceneLoadingOverlay />}>
              <Scene3D
                doc={doc}
                selectedId={selectedId}
                insight={insight}
                techo={roof}
                editing={editing}
                snap={snap}
                camApi={camApi}
                onSelect={setSelectedId}
                onMove={moveAny}
              />
            </Suspense>
          </SceneErrorBoundary>
        )}

        {view === '3d' ? <CameraPanel camApi={camApi} /> : null}
        {view === '2d' || stage === 'interior' ? <InsightsLegend insight={insight} /> : null}
        {view === '3d' ? <TransitionStatus /> : null}


        {editing ? (
          <div className="editing-hud">
            <label>
              Insight
              <select
                value={insight}
                onChange={(event) => setInsight(event.target.value as InsightKey)}
              >
                {INSIGHT_ORDER.map((key) => (
                  <option key={key} value={key}>
                    {INSIGHTS[key].label}
                  </option>
                ))}
              </select>
            </label>
            <button className={snap ? 'active' : ''} onClick={() => setSnap((value) => !value)}>
              {snap ? 'Grilla 250 mm' : 'Movimiento libre'}
            </button>
          </div>
        ) : null}

        {editing && canEditSelection ? (
          <div className="edittoolbar">
            <span className="et-name">{selectedName}</span>
            <button onClick={() => rotateSelection(-15)}>−15°</button>
            <button onClick={() => rotateSelection(15)}>+15°</button>
            {selectedZone?.kind === 'bench' ? (
              <>
                <button
                  onClick={() => {
                    const pairs = Math.max(1, (selectedZone.pairs || 3) - 1)
                    patchZone(selectedZone.id, { pairs, puestos: pairs * 2 })
                  }}
                >
                  − par
                </button>
                <button
                  onClick={() => {
                    const pairs = (selectedZone.pairs || 3) + 1
                    patchZone(selectedZone.id, { pairs, puestos: pairs * 2 })
                  }}
                >
                  + par
                </button>
              </>
            ) : null}
            <button onClick={duplicateSelection}>Duplicar</button>
            <button className="danger" onClick={deleteSelection}>
              Borrar
            </button>
          </div>
        ) : null}

        {toast ? <div className="toast">{toast}</div> : null}
      </main>

      {showPanels ? (
        <aside className="side side--right">
          <Inspector doc={doc} selectedId={selectedId} mode={mode} onPatchZone={patchZone} />
        </aside>
      ) : null}
    </div>
  )
}
