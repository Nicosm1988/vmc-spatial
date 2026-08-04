# VMC Spatial Studio · Piso 16

Gemelo espacial del **Piso 16 (VMC)** de YPF — Torre YPF, Puerto Madero. R3F + Drei.
Layout basado en el mapa dibujado por Nico.

## 🗺️ Distribución
- **Núcleo diamante** con **puerta** al frente (Este); pantallas en las 4 paredes (20/30/24/24).
- **Frente (Este):** PANTALLA GRANDE + 3 oficinas (Central, N, S).
- **Fondo (Oeste):** 1 oficina en la punta.
- **2 oficinas circulares** en los laterales.
- **Comedores** (mesas largas con sillas a ambos lados) intercalados.
- **Islas bench** (mesas enfrentadas, perpendiculares) en los 4 arcos.

## 🧱 Stack
Vite + React + TS + @react-three/fiber + @react-three/drei + three. Build en Vercel.

## 🚀 Local
```bash
npm install && npm run dev
```

## 📐 Ajustar
Zonas en `src/data/vmcPiso16.ts` (cx, cy, rot, pairs, w). Pantallas por pared: `videoWalls` (pantallas + filas).
