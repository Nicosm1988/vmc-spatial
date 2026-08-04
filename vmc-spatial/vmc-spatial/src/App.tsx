import { Suspense, useEffect, useRef, useState } from 'react'
import type { AppMode, InsightKey, VmcDocument, Zone, ViewKind, ZoneKind, VideoWall } from './types'
import { VMC_PISO_16 } from './data/vmcPiso16'
import { INSIGHT_ORDER, INSIGHTS } from './lib/insights'
import { wallGeom, wallFrom } from './lib/geometry'
import { clearDoc, exportJson, importJson, loadDoc, saveDoc } from './lib/persistence'
import Plan2D from './components/Plan2D'
import Scene3D from './components/Scene3D'
import Structure from './components/Structure'
import Inspector from './components/Inspector'
import InsightsLegend from './components/InsightsLegend'
import Palette from './components/Palette'

const freshPreset = (): VmcDocument => JSON.parse(JSON.stringify(VMC_PISO_16))
let seq = 1

function newZone(kind: ZoneKind, cx: number, cy: number): Zone {
  const id = `${kind}-${Date.now()}-${seq++}`
  const base = { id, cx, cy, color: '#1f8fff', puestos: 0, ocupacion: 60, datalizacion: 40, nota: 'Nuevo objeto.' }
  if (kind === 'bench') return { ...base, nombre: 'Isla nueva', kind, rot: 0, pairs: 3, puestos: 6, color: '#1f8fff' }
  if (kind === 'circular') return { ...base, nombre: 'Mesa redonda', kind, r: 1650, color: '#2f6f7a' }
  if (kind === 'comedor') return { ...base, nombre: 'Comedor', kind, rot: 0, w: 3600, h: 1600, color: '#8a5a2b' }
  if (kind === 'oficina') return { ...base, nombre: 'Oficina', kind, rot: 0, w: 3800, h: 2600, puestos: 1, color: '#2a4a86' }
  return { ...base, nombre: 'Objeto', kind } as Zone
}

export default function App() {
  const [doc, setDoc] = useState<VmcDocument>(() => loadDoc() || freshPreset())
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [mode, setMode] = useState<AppMode>('explorar')
  const [view, setView] = useState<ViewKind>('3d')
  const [insight, setInsight] = useState<InsightKey>('none')
  const [noche, setNoche] = useState(false)
  const [techo, setTecho] = useState(false)
  const [snap, setSnap] = useState(true)
  const [toast, setToast] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement | null>(null)
  const editing = mode !== 'explorar'
  const selZone = doc.zonas.find((z) => z.id === selectedId) || null
  const selWall = doc.videoWalls.find((w) => w.id === selectedId) || null

  useEffect(() => { const t = setTimeout(() => saveDoc(doc), 700); return () => clearTimeout(t) }, [doc])
  function flash(msg: string) { setToast(msg); setTimeout(() => setToast(null), 2000) }

  function patchZone(id: string, patch: Partial<Zone>) { setDoc((d) => ({ ...d, actualizado: new Date().toISOString(), zonas: d.zonas.map((z) => (z.id === id ? { ...z, ...patch } : z)) })) }
  function patchWall(id: string, patch: { len?: number; ang?: number; cx?: number; cy?: number; pantallas?: number; filas?: number }) {
    setDoc((d) => ({ ...d, actualizado: new Date().toISOString(), videoWalls: d.videoWalls.map((w) => {
      if (w.id !== id) return w
      const g = wallGeom(w)
      const cx = patch.cx ?? g.cx, cy = patch.cy ?? g.cy, len = patch.len ?? g.len, ang = patch.ang ?? g.ang
      const e = wallFrom(cx, cy, len, ang)
      return { ...w, ...e, pantallas: patch.pantallas ?? w.pantallas, filas: patch.filas ?? w.filas }
    }) }))
  }
  function moveAny(id: string, cxmm: number, cymm: number) { if (doc.videoWalls.some((w) => w.id === id)) patchWall(id, { cx: cxmm, cy: cymm }); else patchZone(id, { cx: cxmm, cy: cymm }) }

  function addZone(kind: ZoneKind) { const z = newZone(kind, Math.round(doc.ancho / 2) + 6000, Math.round(doc.alto / 2)); setDoc((d) => ({ ...d, zonas: [...d.zonas, z] })); setSelectedId(z.id); flash('Objeto agregado — arrastralo a su lugar') }
  function addWall() { const id = `wall-${Date.now()}-${seq++}`; const e = wallFrom(31000, 8000, 8000, 0); const w: VideoWall = { id, nombre: 'Pared nueva', ...e, pantallas: 12, filas: 2 }; setDoc((d) => ({ ...d, videoWalls: [...d.videoWalls, w] })); setSelectedId(id); flash('Pared agregada — arrastrala y ajustá largo/filas') }
  function deleteSel() { if (!selectedId) return; setDoc((d) => ({ ...d, zonas: d.zonas.filter((z) => z.id !== selectedId), videoWalls: d.videoWalls.filter((w) => w.id !== selectedId) })); setSelectedId(null); flash('Eliminado') }
  function duplicateSel() {
    if (selWall) { const id = `wall-${Date.now()}-${seq++}`; const g = wallGeom(selWall); const e = wallFrom(g.cx + 2500, g.cy + 1500, g.len, g.ang); setDoc((d) => ({ ...d, videoWalls: [...d.videoWalls, { ...selWall, id, ...e, nombre: selWall.nombre + ' (copia)' }] })); setSelectedId(id); flash('Duplicado'); return }
    if (selZone) { const c = { ...selZone, id: `${selZone.kind}-${Date.now()}-${seq++}`, cx: selZone.cx + 2500, cy: selZone.cy + 1500, nombre: selZone.nombre + ' (copia)' }; setDoc((d) => ({ ...d, zonas: [...d.zonas, c] })); setSelectedId(c.id); flash('Duplicado') }
  }
  function rotateSel(deg: number) { if (selWall) { const g = wallGeom(selWall); patchWall(selWall.id, { ang: g.ang + (deg * Math.PI) / 180 }); return } if (selZone) patchZone(selZone.id, { rot: (selZone.rot || 0) + (deg * Math.PI) / 180 }) }

  function resetPreset() { if (!confirm('¿Restablecer el preset? Se pierden los cambios locales.')) return; setDoc(freshPreset()); setSelectedId(null); clearDoc(); flash('Preset restablecido') }
  async function onImportFile(e: React.ChangeEvent<HTMLInputElement>) { const f = e.target.files?.[0]; if (!f) return; try { const imported = await importJson(f); setDoc(imported); setSelectedId(null); flash('Documento importado') } catch (err: any) { flash(err?.message || 'No se pudo importar') } finally { if (fileRef.current) fileRef.current.value = '' } }
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (!editing || !selectedId) return; if ((e.key === 'Delete' || e.key === 'Backspace') && !(e.target as HTMLElement).matches('input,textarea')) deleteSel() }
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey)
  }, [editing, selectedId, doc])

  const selName = selWall ? selWall.nombre : selZone ? selZone.nombre : ''
  const canEditSel = !!(selWall || (selZone && selZone.kind !== 'nucleo'))

  return (
    <div className="app">
      <div className="topbar">
        <div className="brand"><span className="dot" /><span>VMC Spatial Studio</span><small>· editor en vivo</small></div>
        <div className="spacer" />
        <div className="seg">
          {(['explorar', 'editar2d', 'editar3d'] as AppMode[]).map((m) => (<button key={m} className={mode === m ? 'active' : ''} onClick={() => { setMode(m); if (m === 'editar3d') setView('3d'); if (m === 'editar2d') setView('2d') }}>{m === 'explorar' ? 'Explorar' : m === 'editar2d' ? 'Editar 2D' : 'Editar 3D'}</button>))}
        </div>
        <div className="seg">
          <button className={view === '2d' ? 'active' : ''} onClick={() => setView('2d')}>Plano 2D</button>
          <button className={view === '3d' ? 'active' : ''} onClick={() => setView('3d')}>Vista 3D</button>
        </div>
        <select value={insight} onChange={(e) => setInsight(e.target.value as InsightKey)} className="isel">{INSIGHT_ORDER.map((k) => <option key={k} value={k}>{INSIGHTS[k].label}</option>)}</select>
        {editing && <button className={snap ? 'active' : ''} onClick={() => setSnap((v) => !v)}>{snap ? '🧲 Grilla ON' : 'Grilla OFF'}</button>}
        {view === '3d' && (<><button className={noche ? 'active' : ''} onClick={() => setNoche((v) => !v)}>{noche ? '🌙 Noche' : '☀️ Día'}</button><button className={techo ? 'active' : ''} onClick={() => setTecho((v) => !v)}>{techo ? 'Techo on' : 'Techo off'}</button></>)}
        <button onClick={() => exportJson(doc)}>Exportar</button>
        <button onClick={() => fileRef.current?.click()}>Importar</button>
        <button className="danger" onClick={resetPreset}>Reset</button>
        <input ref={fileRef} type="file" accept="application/json,.json" style={{ display: 'none' }} onChange={onImportFile} />
      </div>
      <aside className="side left">{editing && <Palette onAdd={addZone} onAddWall={addWall} />}<Structure doc={doc} selectedId={selectedId} onSelect={setSelectedId} /></aside>
      <main className="stage">
        {view === '2d'
          ? <Plan2D doc={doc} selectedId={selectedId} insight={insight} editing={editing} snap={snap} onSelect={setSelectedId} onMove={moveAny} />
          : (<Suspense fallback={<div className="loading3d">Cargando escena 3D…</div>}><Scene3D doc={doc} selectedId={selectedId} insight={insight} noche={noche} techo={techo} editing={editing} snap={snap} onSelect={setSelectedId} onMove={moveAny} /></Suspense>)}
        <InsightsLegend insight={insight} />
        {editing && canEditSel && (
          <div className="edittoolbar">
            <span className="et-name">✏️ {selName}</span>
            <button onClick={() => rotateSel(-15)}>⟲ -15°</button>
            <button onClick={() => rotateSel(15)}>⟳ +15°</button>
            {selZone?.kind === 'bench' && <button onClick={() => patchZone(selZone.id, { pairs: Math.max(1, (selZone.pairs || 3) - 1), puestos: Math.max(1, (selZone.pairs || 3) - 1) * 2 })}>➖ par</button>}
            {selZone?.kind === 'bench' && <button onClick={() => patchZone(selZone.id, { pairs: (selZone.pairs || 3) + 1, puestos: ((selZone.pairs || 3) + 1) * 2 })}>➕ par</button>}
            {selWall && <button onClick={() => patchWall(selWall.id, { pantallas: selWall.pantallas + 2 })}>➕ pant.</button>}
            {selWall && <button onClick={() => patchWall(selWall.id, { pantallas: Math.max(2, selWall.pantallas - 2) })}>➖ pant.</button>}
            <button onClick={duplicateSel}>⧉ Duplicar</button>
            <button className="danger" onClick={deleteSel}>🗑️ Borrar</button>
          </div>
        )}
        {editing && <div className="edithint">Modo edición: arrastrá objetos y paredes · Del = borrar</div>}
        {toast && <div className="toast">{toast}</div>}
      </main>
      <aside className="side right"><Inspector doc={doc} selectedId={selectedId} mode={mode} onPatchZone={patchZone} onPatchWall={patchWall} /></aside>
    </div>
  )
}
