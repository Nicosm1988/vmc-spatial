# VMC Spatial Studio · Piso 16

Gemelo espacial **local-first** del **Piso 16 (Value Management Center)** de YPF — Torre YPF, Macacha Güemes 515, Puerto Madero, CABA. Inspirado en Senda Spatial Studio, con el preset del VMC.

Todo el piso se deriva de **un único documento** (`src/data/vmcPiso16.ts`) con las dimensiones en **milímetros enteros**. El plano 2D, la escena 3D y los mapas de insights se calculan a partir de ese documento.

> ⚠️ **Maqueta conceptual.** No es plano constructivo. Las cotas son aproximadas y se ajustan contra el plano de Obra Civil (PEP 6400-25-011).

## 🫘 Planta en forma de lente (Torre Pelli)

A diferencia de la v1 (rectangular), esta versión modela la **huella real** de la Torre YPF: una **lente/almendra de ~1.600 m²**, eje largo Este–Oeste. Orientación:

- **Norte:** Bv. Macacha Güemes
- **Sur:** Manuela Sáenz
- **Oeste:** Juana Manso (ciudad)
- **Este:** Río de la Plata

El contorno se genera en `src/lib/plate.ts` (`lensPlate`) y se usa para dibujar el piso, recortar las zonas (clipPath en 2D) y extruir el 3D (`THREE.Shape`).

## 🎨 Paleta oficial

Degradado azul-verde **`#0424D9 → #03C1BD`** (Look & Feel VMC).

## 🧩 Clusters (según VMC 10.12.25, slide 7)

- **Oeste:** Margen Integrado (43 puestos, el más grande)
- **Sur:** Competitividad + EO (37)
- **Norte:** Performance (10)
- **Este:** Midstream (8) · Proyectos Especiales (6)
- **Centro:** Núcleo con 4 Video Walls · Mesa de Troubleshooting · Salas de reunión
- Planificación MID (6)

## ✨ Funcionalidad

- **Plano 2D (SVG):** pan, zoom, click para seleccionar, calles + rosa de los vientos, zonas recortadas al contorno real.
- **Vista 3D (Three.js):** piso extruido con la forma de lente, video walls iluminados, día/noche, techo on/off, fallback sin WebGL.
- **Modos:** Explorar / Editar 2D / Editar 3D.
- **Inspector:** nombre, color, puestos, ocupación, % datalización, cotas y notas — en vivo.
- **Insights:** Ocupación · Densidad · Capacidad · **% Datalización**.
- **Persistencia:** autoguardado en localStorage. Import / Export JSON.

## 🧱 Stack

Vite + React + TypeScript + Three.js. **Sin backend.** El build lo hace Vercel en la nube.

## 🚀 Local (opcional, Node 18+)

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # genera /dist
```

## ☁️ Deploy

Vercel detecta `vercel.json` (framework Vite) y corre `vite build` en cada push a `main`. **Root Directory** debe apuntar a la carpeta que contiene `package.json`.

## 📐 Ajustar dimensiones

- La forma de la lente: parámetros `halfL`, `halfW`, `pointiness` en `src/data/vmcPiso16.ts`.
- Cada cluster: `x, y, w, h` en **mm**. También desde el **Inspector** en modo Editar → Exportar JSON.
