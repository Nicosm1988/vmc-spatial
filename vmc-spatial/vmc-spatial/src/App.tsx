// ============================================================================
// App raíz de VMC Spatial Studio. Documento en estado con autoguardado, topbar
// + sidebars + stage (2D/3D con la planta en forma de lente).
// ============================================================================
import { useEffect, useMemo, useRef, useState } from 'react'
import type { AppMode, InsightKey, VmcDocument, Zone, ViewKind } from './types'
import { VMC_PISO_16 } from './data/vmcPiso16'
import { INSIGHT_ORDER, INSIGHTS } from './lib/insights'
import { clearDoc, exportJson, importJson, loadDoc, saveDoc } from './lib/persistence'
import Plan2D from './components/Plan2D'
import Scene3D from './components/Scene3D'
import Structure from './components/Structure'
import Inspector from './components/Inspector'
import InsightsLegend from './components/InsightsLegend'

const freshPreset = (): VmcDocument => JSON.parse(JSON.stringify(VMC_PISO_16))

export default function App() {
  const [doc, setDoc] = useState<VmcDocument>(() => loadDoc() || freshPreset())
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [mode, setMode] = useState<AppMode>('explorar')
  const [view, setView] = useState<ViewKind>('2d')
  const [insight, setInsight] = useState<InsightKey>('none')
  const [noche, setNoche] = useState(false)
  const [techo, setTecho] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    const t = setTimeout(() => saveDoc(doc), 700)
    return () => clearTimeout(t)
  }, [doc])

  function flash(msg: string) { setToast(msg); setTimeout(() => setToast(null), 2200) }

  function patchZone(id: string, patch: Partial<Zone>) {
    setDoc((d) => ({
      ...d,
      actualizado: new Date().toISOString(),
      zonas: d.zonas.map((z) => (z.id === id ? { ...z, ...patch } : z)),
    }))
  }

  function resetPreset() {
    if (!confirm('¿Restablecer el preset VMC Piso 16? Se pierden los cambios locales.')) return
    setDoc(freshPreset()); setSelectedId(null); clearDoc(); flash('Preset restablecido')
  }

  async function onImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    try {
      const imported = await importJson(f)
      setDoc(imported); setSelectedId(null); flash('Documento importado')
    } catch (err: any) {
      flash(err?.message || 'No se pudo importar')
    } finally {
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  useMemo(() => INSIGHTS[insight], [insight])

  return (
    <div className="app">
      {/* TOPBAR */}
      <div className="topbar">
        <div className="brand">
          <span className="dot" />
          <span>VMC Spatial Studio</span>
          <small>· {doc.piso}</small>
        </div>
        <div className="spacer" />

        <div className="seg">
          {(['explorar', 'editar2d', 'editar3d'] as AppMode[]).map((m) => (
            <button key={m} className={mode === m ? 'active' : ''}
              onClick={() => { setMode(m); if (m === 'editar3d') setView('3d'); if (m === 'editar2d') setView('2d') }}>
              {m === 'explorar' ? 'Explorar' : m === 'editar2d' ? 'Editar 2D' : 'Editar 3D'}
            </button>
          ))}
        </div>

        <div className="seg">
          <button className={view === '2d' ? 'active' : ''} onClick={() => setView('2d')}>Plano 2D</button>
          <button className={view === '3d' ? 'active' : ''} onClick={() => setView('3d')}>Vista 3D</button>
        </div>

        <select value={insight} onChange={(e) => setInsight(e.target.value as InsightKey)} className="isel">
          {INSIGHT_ORDER.map((k) => <option key={k} value={k}>{INSIGHTS[k].label}</option>)}
        </select>

        {view === '3d' && (
          <>
            <button className={noche ? 'active' : ''} onClick={() => setNoche((v) => !v)}>{noche ? '🌙 Noche' : '☀️ Día'}</button>
            <button className={techo ? 'active' : ''} onClick={() => setTecho((v) => !v)}>{techo ? 'Techo on' : 'Techo off'}</button>
          </>
        )}

        <button onClick={() => exportJson(doc)}>Exportar JSON</button>
        <button onClick={() => fileRef.current?.click()}>Importar</button>
        <button className="danger" onClick={resetPreset}>Reset</button>
        <input ref={fileRef} type="file" accept="application/json,.json" style={{ display: 'none' }} onChange={onImportFile} />
      </div>

      {/* IZQUIERDA */}
      <aside className="side left">
        <Structure doc={doc} selectedId={selectedId} onSelect={setSelectedId} />
      </aside>

      {/* STAGE */}
      <main className="stage">
        {view === '2d'
          ? <Plan2D doc={doc} selectedId={selectedId} insight={insight} onSelect={setSelectedId} />
          : <Scene3D doc={doc} selectedId={selectedId} insight={insight} noche={noche} techo={techo} onSelect={setSelectedId} />}
        <InsightsLegend insight={insight} />
        {toast && <div className="toast">{toast}</div>}
      </main>

      {/* DERECHA */}
      <aside className="side right">
        <Inspector doc={doc} selectedId={selectedId} mode={mode} onPatch={patchZone} />
      </aside>
    </div>
  )
}
