import type { AppMode, VmcDocument, Zone } from '../types'
import { wallGeom } from '../lib/geometry'
interface Props {
  doc: VmcDocument
  selectedId: string | null
  mode: AppMode
  onPatchZone: (id: string, patch: Partial<Zone>) => void
}
export default function Inspector({ doc, selectedId, mode, onPatchZone }: Props) {
  const z = doc.zonas.find((x) => x.id === selectedId) || null
  const wall = doc.videoWalls.find((w) => w.id === selectedId) || null
  const editable = mode !== 'explorar'
  const num = (v: string) => {
    const n = Number(v)
    return Number.isFinite(n) ? n : 0
  }
  if (wall) {
    const g = wallGeom(wall)
    return (
      <div>
        <h3>Inspector · {wall.nombre}</h3>
        <div className="hint" style={{ marginBottom: 12 }}>
          Estructura fija del núcleo. Su posición, orientación y cantidad de pantallas están
          bloqueadas para conservar la puerta y el montaje.
        </div>
        <div className="row2">
          <div className="field">
            <label>Largo</label>
            <output>{Math.round(g.len)} mm</output>
          </div>
          <div className="field">
            <label>Orientación</label>
            <output>{Math.round((g.ang * 180) / Math.PI)}°</output>
          </div>
        </div>
        <div className="row2">
          <div className="field">
            <label>Pantallas</label>
            <output>{wall.pantallas}</output>
          </div>
          <div className="field">
            <label>Filas</label>
            <output>{wall.filas || 2}</output>
          </div>
        </div>
      </div>
    )
  }
  if (!z)
    return (
      <div>
        <h3>Inspector</h3>
        <div className="empty">
          Seleccioná un objeto para editarlo o una pared estructural para consultar su montaje.
        </div>
      </div>
    )
  const dis = !editable,
    isBench = z.kind === 'bench',
    isCirc = z.kind === 'circular',
    isRect = z.kind === 'comedor' || z.kind === 'oficina'
  return (
    <div>
      <h3>Inspector · {z.nombre}</h3>
      {!editable && (
        <div className="hint" style={{ marginBottom: 10 }}>
          Pasá a <b>Editar</b>.
        </div>
      )}
      <div className="field">
        <label>Nombre</label>
        <input
          type="text"
          value={z.nombre}
          disabled={dis}
          onChange={(e) => onPatchZone(z.id, { nombre: e.target.value })}
        />
      </div>
      <div className="field">
        <label>Color</label>
        <input
          type="color"
          value={z.color}
          disabled={dis}
          onChange={(e) => onPatchZone(z.id, { color: e.target.value })}
        />
      </div>
      {isBench && (
        <div className="field">
          <label>Pares · {z.pairs}</label>
          <input
            className="slider"
            type="range"
            min={1}
            max={8}
            value={z.pairs || 0}
            disabled={dis}
            onChange={(e) =>
              onPatchZone(z.id, { pairs: num(e.target.value), puestos: num(e.target.value) * 2 })
            }
          />
        </div>
      )}
      {isCirc && (
        <div className="field">
          <label>Radio (mm) · {z.r}</label>
          <input
            className="slider"
            type="range"
            min={800}
            max={3200}
            step={50}
            value={z.r || 1650}
            disabled={dis}
            onChange={(e) => onPatchZone(z.id, { r: num(e.target.value) })}
          />
        </div>
      )}
      {isRect && (
        <>
          <div className="field">
            <label>↔ Ancho (mm) · {z.w}</label>
            <input
              className="slider"
              type="range"
              min={1200}
              max={12000}
              step={100}
              value={z.w || 3600}
              disabled={dis}
              onChange={(e) => onPatchZone(z.id, { w: num(e.target.value) })}
            />
          </div>
          <div className="field">
            <label>↕ Largo (mm) · {z.h}</label>
            <input
              className="slider"
              type="range"
              min={800}
              max={10000}
              step={100}
              value={z.h || 2600}
              disabled={dis}
              onChange={(e) => onPatchZone(z.id, { h: num(e.target.value) })}
            />
          </div>
        </>
      )}
      {(isBench || isRect) && (
        <div className="field">
          <label>Rotación (°) · {Math.round(((z.rot || 0) * 180) / Math.PI)}</label>
          <input
            className="slider"
            type="range"
            min={0}
            max={360}
            value={Math.round(((z.rot || 0) * 180) / Math.PI)}
            disabled={dis}
            onChange={(e) => onPatchZone(z.id, { rot: (num(e.target.value) * Math.PI) / 180 })}
          />
        </div>
      )}
      <div className="field">
        <label>Ocupación · {Math.round(z.ocupacion)} %</label>
        <input
          className="slider"
          type="range"
          min={0}
          max={100}
          value={z.ocupacion}
          disabled={dis}
          onChange={(e) => onPatchZone(z.id, { ocupacion: num(e.target.value) })}
        />
      </div>
      {editable && (
        <div className="row2">
          <div className="field">
            <label>X (mm)</label>
            <input
              type="number"
              value={z.cx}
              onChange={(e) => onPatchZone(z.id, { cx: num(e.target.value) })}
            />
          </div>
          <div className="field">
            <label>Y (mm)</label>
            <input
              type="number"
              value={z.cy}
              onChange={(e) => onPatchZone(z.id, { cy: num(e.target.value) })}
            />
          </div>
        </div>
      )}
      <div className="hint" style={{ marginBottom: 12 }}>
        Tipo: <span className="badge">{z.kind}</span>
      </div>
      
      {doc.relevamiento && doc.relevamiento.length > 0 && (
        <div className="metrics-panel" style={{ marginTop: 24, padding: 12, background: 'rgba(0,0,0,0.1)', borderRadius: 6 }}>
          <h4 style={{ margin: '0 0 12px 0', fontSize: 13, textTransform: 'uppercase', letterSpacing: 1, color: '#a0aab5' }}>
            Métricas Exactas
          </h4>
          {doc.relevamiento.map((r, i) => (
            <div key={i} style={{ marginBottom: 8, fontSize: 13 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                <span style={{ color: '#fff' }}>{r.element}</span>
                <strong>{r.valueMm} mm</strong>
              </div>
              <div style={{ color: '#8a97a6', fontSize: 11 }}>
                ±{r.toleranceMm}mm · {r.source}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
