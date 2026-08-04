import type { AppMode, VmcDocument, Zone } from '../types'
import { puestosDe } from '../lib/geometry'
interface Props { doc: VmcDocument; selectedId: string | null; mode: AppMode; onPatch: (id: string, patch: Partial<Zone>) => void }
export default function Inspector({ doc, selectedId, mode, onPatch }: Props) {
  const z = doc.zonas.find((x) => x.id === selectedId) || null
  const editable = mode !== 'explorar'
  if (!z) return (<div><h3>Inspector</h3><div className="empty">Seleccioná un objeto. En modo <b>Editar</b> lo podés arrastrar, rotar y redimensionar.</div></div>)
  const dis = !editable
  const num = (v: string) => { const n = Number(v); return Number.isFinite(n) ? n : 0 }
  const isBench = z.kind === 'bench', isCirc = z.kind === 'circular', isRect = z.kind === 'comedor' || z.kind === 'oficina'
  return (
    <div>
      <h3>Inspector · {z.nombre}</h3>
      {!editable && <div className="hint" style={{ marginBottom: 10 }}>Estás en <b>Explorar</b>. Pasá a <b>Editar</b> para modificar.</div>}
      <div className="field"><label>Nombre</label><input type="text" value={z.nombre} disabled={dis} onChange={(e) => onPatch(z.id, { nombre: e.target.value })} /></div>
      <div className="field"><label>Color</label><input type="color" value={z.color} disabled={dis} onChange={(e) => onPatch(z.id, { color: e.target.value })} /></div>
      {isBench && (<div className="field"><label>Pares (escritorios enfrentados) · {z.pairs}</label><input className="slider" type="range" min={1} max={8} value={z.pairs || 0} disabled={dis} onChange={(e) => onPatch(z.id, { pairs: num(e.target.value), puestos: num(e.target.value) * 2 })} /></div>)}
      {isCirc && (<div className="field"><label>Radio (mm) · {z.r}</label><input className="slider" type="range" min={800} max={3200} step={50} value={z.r || 1650} disabled={dis} onChange={(e) => onPatch(z.id, { r: num(e.target.value) })} /></div>)}
      {isRect && (<><div className="field"><label>Ancho (mm) · {z.w}</label><input className="slider" type="range" min={1500} max={9000} step={100} value={z.w || 3600} disabled={dis} onChange={(e) => onPatch(z.id, { w: num(e.target.value) })} /></div>
        <div className="field"><label>Profundidad (mm) · {z.h}</label><input className="slider" type="range" min={1000} max={8000} step={100} value={z.h || 2600} disabled={dis} onChange={(e) => onPatch(z.id, { h: num(e.target.value) })} /></div></>)}
      {(isBench || isRect) && (<div className="field"><label>Rotación (°) · {Math.round(((z.rot || 0) * 180) / Math.PI)}</label><input className="slider" type="range" min={0} max={360} value={Math.round(((z.rot || 0) * 180) / Math.PI)} disabled={dis} onChange={(e) => onPatch(z.id, { rot: (num(e.target.value) * Math.PI) / 180 })} /></div>)}
      <div className="field"><label>Ocupación · {Math.round(z.ocupacion)} %</label><input className="slider" type="range" min={0} max={100} value={z.ocupacion} disabled={dis} onChange={(e) => onPatch(z.id, { ocupacion: num(e.target.value) })} /></div>
      <div className="field"><label>% Datalización · {Math.round(z.datalizacion)} %</label><input className="slider" type="range" min={0} max={100} value={z.datalizacion} disabled={dis} onChange={(e) => onPatch(z.id, { datalizacion: num(e.target.value) })} /></div>
      {editable && (<div className="row2"><div className="field"><label>X (mm)</label><input type="number" value={z.cx} onChange={(e) => onPatch(z.id, { cx: num(e.target.value) })} /></div><div className="field"><label>Y (mm)</label><input type="number" value={z.cy} onChange={(e) => onPatch(z.id, { cy: num(e.target.value) })} /></div></div>)}
      <div className="hint">Tipo: <span className="badge">{z.kind}</span> · {puestosDe(z)} puestos</div>
    </div>
  )
}
