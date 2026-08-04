import { Suspense, useEffect, useRef, useState } from 'react'
import type { AppMode, InsightKey, VmcDocument, Zone, ViewKind, ZoneKind, VideoWall } from './types'
import { VMC_PISO_16 } from './data/vmcPiso16'
import { INSIGHT_ORDER, INSIGHTS } from './lib/insights'
import { wallGeom, wallFrom } from './lib/geometry'
import { clearDoc, exportJson, importJson, loadDoc, saveDoc } from './lib/persistence'
import Plan2D from './components/Plan2D'
import Scene3D, { CamApi } from './components/Scene3D'
import Structure from './components/Structure'
import Inspector from './components/Inspector'
import InsightsLegend from './components/InsightsLegend'
import Palette from './components/Palette'
import CameraPanel from './components/CameraPanel'
function normalizeWalls(d: VmcDocument): VmcDocument { const ccx = d.core.reduce((s, p) => s + p.x, 0) / d.core.length, ccy = d.core.reduce((s, p) => s + p.y, 0) / d.core.length; return { ...d, videoWalls: d.videoWalls.map((w) => { if (w.flip !== undefined) return w; const cx = (w.x1 + w.x2) / 2, cy = (w.y1 + w.y2) / 2, theta = Math.atan2(-(w.y2 - w.y1), w.x2 - w.x1), nzx = Math.sin(theta), nzz = Math.cos(theta); return { ...w, flip: nzx * (cx - ccx) + nzz * (cy - ccy) < 0 } }) } }
const freshPreset = (): VmcDocument => normalizeWalls(JSON.parse(JSON.stringify(VMC_PISO_16)))
let seq = 1
function newZone(kind: ZoneKind, cx: number, cy: number): Zone { const id = `${kind}-${Date.now()}-${seq++}`, base = { id, cx, cy, color: '#1f8fff', puestos: 0, ocupacion: 60, datalizacion: 40, nota: 'Nuevo.' }; if (kind === 'bench') return { ...base, nombre: 'Isla nueva', kind, rot: 0, pairs: 3, puestos: 6, color: '#1f8fff' }; if (kind === 'circular') return { ...base, nombre: 'Mesa redonda', kind, r: 1650, color: '#2f6f7a' }; if (kind === 'comedor') return { ...base, nombre: 'Comedor', kind, rot: 0, w: 3600, h: 1600, color: '#8a5a2b' }; if (kind === 'oficina') return { ...base, nombre: 'Oficina', kind, rot: 0, w: 3800, h: 2600, puestos: 1, color: '#2a4a86' }; return { ...base, nombre: 'Objeto', kind } as Zone }
export default function App() {
  const [doc, setDoc] = useState<VmcDocument>(() => normalizeWalls(loadDoc() || freshPreset()))
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [mode, setMode] = useState<AppMode>('explorar')
  const [view, setView] = useState<ViewKind>('3d')
  const [insight, setInsight] = useState<InsightKey>('none')
  const [noche, setNoche] = useState(false)
  const [techo, setTecho] = useState(false)
  const [snap, setSnap] = useState(false)
  const [building, setBuilding] = useState(false)
  const [cine, setCine] = useState(true)
  const [toast, setToast] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement | null>(null)
  const camApi = useRef<CamApi>({})
  const editing = mode !== 'explorar'
  const selZone = doc.zonas.find((z) => z.id === selectedId) || null
  const selWall = doc.videoWalls.find((w) => w.id === selectedId) || null
  useEffect(() => { const t = setTimeout(() => saveDoc(doc), 700); return () => clearTimeout(t) }, [doc])
  function flash(m: string) { setToast(m); setTimeout(() => setToast(null), 2000) }
  function patchZone(id: string, patch: Partial<Zone>) { setDoc((d) => ({ ...d, actualizado: new Date().toISOString(), zonas: d.zonas.map((z) => (z.id === id ? { ...z, ...patch } : z)) })) }
  function patchWall(id: string, patch: any) { setDoc((d) => ({ ...d, actualizado: new Date().toISOString(), videoWalls: d.videoWalls.map((w) => { if (w.id !== id) return w; const g = wallGeom(w), cx = patch.cx ?? g.cx, cy = patch.cy ?? g.cy, len = patch.len ?? g.len, ang = patch.ang ?? g.ang, e = wallFrom(cx, cy, len, ang); return { ...w, ...e, pantallas: patch.pantallas ?? w.pantallas, filas: patch.filas ?? w.filas, flip: patch.flip ?? w.flip } }) })) }
  function flipWall(id: string) { const w = doc.videoWalls.find((x) => x.id === id); if (w) patchWall(id, { flip: !w.flip }); flash('Lado cambiado') }
  function moveAny(id: string, cxmm: number, cymm: number) { if (doc.videoWalls.some((w) => w.id === id)) patchWall(id, { cx: cxmm, cy: cymm }); else patchZone(id, { cx: cxmm, cy: cymm }) }
  function addZone(kind: ZoneKind) { const z = newZone(kind, 12000, 20000); setDoc((d) => ({ ...d, zonas: [...d.zonas, z] })); setSelectedId(z.id); flash('Objeto agregado') }
  function addWall() { const id = `wall-${Date.now()}-${seq++}`, e = wallFrom(12000, 12000, 8000, 0), w: VideoWall = { id, nombre: 'Pared nueva', ...e, pantallas: 12, filas: 2, flip: false }; setDoc((d) => ({ ...d, videoWalls: [...d.videoWalls, w] })); setSelectedId(id); flash('Pared agregada') }
  function deleteSel() { if (!selectedId) return; setDoc((d) => ({ ...d, zonas: d.zonas.filter((z) => z.id !== selectedId), videoWalls: d.videoWalls.filter((w) => w.id !== selectedId) })); setSelectedId(null); flash('Eliminado') }
  function duplicateSel() { if (selWall) { const id = `wall-${Date.now()}-${seq++}`, g = wallGeom(selWall), e = wallFrom(g.cx + 2500, g.cy + 1500, g.len, g.ang); setDoc((d) => ({ ...d, videoWalls: [...d.videoWalls, { ...selWall, id, ...e, nombre: selWall.nombre + ' (copia)' }] })); setSelectedId(id); flash('Duplicado'); return } if (selZone) { const c = { ...selZone, id: `${selZone.kind}-${Date.now()}-${seq++}`, cx: selZone.cx + 2500, cy: selZone.cy + 1500, nombre: selZone.nombre + ' (copia)' }; setDoc((d) => ({ ...d, zonas: [...d.zonas, c] })); setSelectedId(c.id); flash('Duplicado') } }
  function rotateSel(deg: number) { if (selWall) { const g = wallGeom(selWall); patchWall(selWall.id, { ang: g.ang + (deg * Math.PI) / 180 }); return } if (selZone) patchZone(selZone.id, { rot: (selZone.rot || 0) + (deg * Math.PI) / 180 }) }
  function resizeWall(delta: number) { if (selWall) { const g = wallGeom(selWall); patchWall(selWall.id, { len: Math.max(2000, g.len + delta) }) } }
  function resetPreset() { if (!confirm('¿Restablecer? Se pierden los cambios.')) return; setDoc(freshPreset()); setSelectedId(null); clearDoc(); flash('Restablecido') }
  async function onImportFile(e: React.ChangeEvent<HTMLInputElement>) { const f = e.target.files?.[0]; if (!f) return; try { const im = await importJson(f); setDoc(normalizeWalls(im)); setSelectedId(null); flash('Importado') } catch (err: any) { flash(err?.message || 'Error') } finally { if (fileRef.current) fileRef.current.value = '' } }
  useEffect(() => { function onKey(e: KeyboardEvent) { if (!editing || !selectedId) return; if ((e.key === 'Delete' || e.key === 'Backspace') && !(e.target as HTMLElement).matches('input,textarea')) deleteSel() } window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey) }, [editing, selectedId, doc])
  const selName = selWall ? selWall.nombre : selZone ? selZone.nombre : '', canEditSel = !!(selWall || (selZone && selZone.kind !== 'nucleo'))
  return (
    <div className="app">
      <div className="topbar">
        <div className="brand"><span className="dot" /><span>VMC Spatial Studio</span><small>· Torre YPF</small></div>
        <div className="spacer" />
        <div className="seg">{(['explorar', 'editar2d', 'editar3d'] as AppMode[]).map((m) => (<button key={m} className={mode === m ? 'active' : ''} onClick={() => { setMode(m); if (m === 'editar3d') setView('3d'); if (m === 'editar2d') setView('2d') }}>{m === 'explorar' ? 'Explorar' : m === 'editar2d' ? 'Editar 2D' : 'Editar 3D'}</button>))}</div>
        <div className="seg"><button className={view === '2d' ? 'active' : ''} onClick={() => setView('2d')}>Plano 2D</button><button className={view === '3d' ? 'active' : ''} onClick={() => setView('3d')}>Vista 3D</button></div>
        <select value={insight} onChange={(e) => setInsight(e.target.value as InsightKey)} className="isel">{INSIGHT_ORDER.map((k) => <option key={k} value={k}>{INSIGHTS[k].label}</option>)}</select>
        {editing && <button className={snap ? 'active' : ''} onClick={() => setSnap((v) => !v)}>{snap ? '🧲 Grilla' : '🖐️ Libre'}</button>}
        {view === '3d' && (<><button className={cine ? 'active' : ''} onClick={() => setCine((v) => !v)}>{cine ? '🎬 Cine ON' : 'Cine OFF'}</button><button className={building ? 'active' : ''} onClick={() => setBuilding((v) => !v)}>{building ? '🏢 Torre' : '🏙️ Ver Torre'}</button><button className={noche ? 'active' : ''} onClick={() => setNoche((v) => !v)}>{noche ? '🌙' : '☀️'}</button></>)}
        <button onClick={() => exportJson(doc)}>Exportar</button><button onClick={() => fileRef.current?.click()}>Importar</button><button className="danger" onClick={resetPreset}>Reset</button>
        <input ref={fileRef} type="file" accept="application/json,.json" style={{ display: 'none' }} onChange={onImportFile} />
      </div>
      <aside className="side left">{editing && <Palette onAdd={addZone} onAddWall={addWall} />}<Structure doc={doc} selectedId={selectedId} onSelect={setSelectedId} /></aside>
      <main className="stage">
        {view === '2d' ? <Plan2D doc={doc} selectedId={selectedId} insight={insight} editing={editing} snap={snap} onSelect={setSelectedId} onMove={moveAny} /> : (<Suspense fallback={<div className="loading3d">Cargando escena 3D…</div>}><Scene3D doc={doc} selectedId={selectedId} insight={insight} noche={noche} techo={techo} editing={editing} snap={snap} building={building} cine={cine} camApi={camApi} onSelect={setSelectedId} onMove={moveAny} /></Suspense>)}
        {view === '3d' && <CameraPanel camApi={camApi} />}
        <InsightsLegend insight={insight} />
        {editing && canEditSel && (<div className="edittoolbar"><span className="et-name">✏️ {selName}</span><button onClick={() => rotateSel(-15)}>⟲ -15°</button><button onClick={() => rotateSel(15)}>⟳ +15°</button>{selZone?.kind === 'bench' && <button onClick={() => patchZone(selZone.id, { pairs: Math.max(1, (selZone.pairs || 3) - 1), puestos: Math.max(1, (selZone.pairs || 3) - 1) * 2 })}>➖ par</button>}{selZone?.kind === 'bench' && <button onClick={() => patchZone(selZone.id, { pairs: (selZone.pairs || 3) + 1, puestos: ((selZone.pairs || 3) + 1) * 2 })}>➕ par</button>}{selWall && <button onClick={() => resizeWall(-1000)}>↔ -1m</button>}{selWall && <button onClick={() => resizeWall(1000)}>↔ +1m</button>}{selWall && <button onClick={() => flipWall(selWall.id)}>🔃 Lado</button>}<button onClick={duplicateSel}>⧉ Duplicar</button><button className="danger" onClick={deleteSel}>🗑️ Borrar</button></div>)}
        {toast && <div className="toast">{toast}</div>}
      </main>
      <aside className="side right"><Inspector doc={doc} selectedId={selectedId} mode={mode} onPatchZone={patchZone} onPatchWall={patchWall} onFlipWall={flipWall} /></aside>
    </div>
  )
}
