import type { AppMode, VmcDocument, Zone } from '../types'
import { areaM2, densidad } from '../lib/geometry'
interface Props { doc: VmcDocument; selectedId: string | null; mode: AppMode; onPatch: (id: string, patch: Partial<Zone>) => void }
export default function Inspector({ doc, selectedId, mode, onPatch }: Props) {
  const z = doc.zonas.find((x) => x.id === selectedId) || null
  const editable = mode !== 'explorar'
  if (!z) return (<div><h3>Inspector</h3><div className="empty">Seleccioná un cluster en el plano, en el 3D o en la lista de estructura para ver y editar sus propiedades.</div></div>)
  const dis = !editable
  const num = (v: string) => { const n = Number(v); return Number.isFinite(n) ? n : 0 }
  return (
    <div>
      <h3>Inspector · {z.nombre}</h3>
      {!editable && <div className="hint" style={{ marginBottom: 10 }}>Estás en <b>Explorar</b>. Pasá a <b>Editar 2D/3D</b> para modificar.</div>}
      <div className="field"><label>Nombre</label><input type="text" value={z.nombre} disabled={dis} onChange={(e) => onPatch(z.id, { nombre: e.target.value })} /></div>
      <div className="field"><label>Color</label><input type="color" value={z.color} disabled={dis} onChange={(e) => onPatch(z.id, { color: e.target.value })} /></div>
      <div className="row2">
        <div className="field"><label>Puestos</label><input type="number" min={0} value={z.puestos} disabled={dis} onChange={(e) => onPatch(z.id, { puestos: num(e.target.value) })} /></div>
        <div className="field"><label>Área (m²)</label><input type="text" value={areaM2(z).toFixed(1)} disabled /></div>
      </div>
      <div className="field"><label>Ocupación · {Math.round(z.ocupacion)} %</label><input className="slider" type="range" min={0} max={100} value={z.ocupacion} disabled={dis} onChange={(e) => onPatch(z.id, { ocupacion: num(e.target.value) })} /></div>
      <div className="field"><label>% Datalización · {Math.round(z.datalizacion)} %</label><input className="slider" type="range" min={0} max={100} value={z.datalizacion} disabled={dis} onChange={(e) => onPatch(z.id, { datalizacion: num(e.target.value) })} /></div>
      {editable && (<div className="row2"><div className="field"><label>Ancho (mm)</label><input type="number" value={z.w} onChange={(e) => onPatch(z.id, { w: num(e.target.value) })} /></div><div className="field"><label>Alto (mm)</label><input type="number" value={z.h} onChange={(e) => onPatch(z.id, { h: num(e.target.value) })} /></div></div>)}
      {editable && (<div className="row2"><div className="field"><label>X (mm)</label><input type="number" value={z.x} onChange={(e) => onPatch(z.id, { x: num(e.target.value) })} /></div><div className="field"><label>Y (mm)</label><input type="number" value={z.y} onChange={(e) => onPatch(z.id, { y: num(e.target.value) })} /></div></div>)}
      <div className="field"><label>Nota</label><textarea value={z.nota || ''} disabled={dis} onChange={(e) => onPatch(z.id, { nota: e.target.value })} /></div>
      <div className="hint">Densidad: <b>{densidad(z).toFixed(1)}</b> p/10 m² · Tipo: <span className="badge">{z.kind}</span></div>
    </div>
  )
}
