# VMC Spatial Studio · Piso 16

Gemelo espacial **local-first** del **Piso 16 (Value Management Center)** de YPF — Torre YPF, Macacha Güemes 515, Puerto Madero, CABA. Inspirado en Senda Spatial Studio, pero con el preset del VMC.

Todo el piso se deriva de **un único documento** (`src/data/vmcPiso16.ts`) con las dimensiones en **milímetros enteros**. El plano 2D, la escena 3D y los mapas de insights se calculan a partir de ese documento.

> ⚠️ **Maqueta conceptual.** No es un plano constructivo, proyecto ejecutivo ni constancia de evacuación/incendio/estructura. Las cotas son aproximadas y se ajustan contra el plano de Obra Civil (PEP 6400-25-011).

---

## ✨ Qué incluye el MVP

- **Plano 2D interactivo (SVG):** pan con arrastre, zoom con rueda, click para seleccionar zona, grilla de referencia cada 2 m, hot desks, video walls y muros.
- **Vista 3D procedural (Three.js / WebGL2):** zonas extruidas en volúmenes, video walls iluminados, hot desks, OrbitControls, día/noche y techo on/off. Fallback si no hay WebGL.
- **Modos:** Explorar (bloqueado), Editar 2D y Editar 3D.
- **Inspector:** editás nombre, color, puestos, ocupación, % datalización, cotas y notas — en vivo.
- **Insights:** Ocupación, Densidad de puestos, Capacidad y **% Datalización** (enganchable a tu star schema de Dataliza).
- **Persistencia:** autoguardado en `localStorage` (~700 ms). El **JSON exportado** es el respaldo portable.
- **Import / Export JSON** validado.

## 🧱 Stack

Vite + React + TypeScript + Three.js. **Sin backend.** El build lo hace Vercel en la nube (vos no instalás nada localmente).

## 🗺️ Estructura modelada (según Business Case / LAY OUT del VMC)

- **Núcleo central** con 4 Video Walls (+90 pantallas).
- **8 bloques del LAY OUT:** Performance, Margen Integrado, Competitividad+EO, Planificación MID, Control Execution, Business Digital Twin, Data & Information Excellence, Machine Learning & AI, Control Tower.
- **Mesa de Troubleshooting** + **salas de reunión**.
- Puestos por sector: Margen Integrado 43 · Competitividad+EO 37 · Control Execution 12 · Performance 10 · Data&Info 9 · Business Digital Twin 8 · Control Tower 8 · Planificación MID 6 · ML&AI 6.

## 🚀 Desarrollo local (opcional, requiere Node 18+)

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # genera /dist
npm run preview
```

## ☁️ Deploy

Vercel detecta el `vercel.json` (framework Vite) y corre `vite build` automáticamente en cada push a `main`.

## 📐 Cómo ajustar las dimensiones

Editá `src/data/vmcPiso16.ts`: cada zona tiene `x, y, w, h` en **mm** (origen arriba-izquierda). Cambiás los números, hacés commit y Vercel republica. También podés mover/redimensionar desde el **Inspector** en modo Editar y exportar el JSON resultante.
