# VMC Spatial Studio · Piso 16 (3D realista, distribución CAD)

Gemelo espacial del **Piso 16 (VMC)** de YPF — Torre YPF, Puerto Madero. Vista 3D con **React Three Fiber + Drei**: sillas Herman Miller, monitores curvos, escritorios blancos y video walls (grilla de pantallas sobre credenzas), replicando las fotos reales.

## 🗺️ Distribución (plano CAD)

Planta en forma de **lente (Pelli)**, con el **núcleo de servicio central** y los clusters del LAY OUT en el perímetro:
- **Norte:** Data & Information Excellence · Machine Learning & AI · Performance · Control Tower
- **Este (punta):** Troubleshooting
- **Sur:** Operational License & Excellence · Control Execution · Control Execution · Business Digital Twin
- **4 Video Walls** en las caras del núcleo · 2 salas de reunión vidriadas.

## 🪑 Muebles (según fotos)

- **Silla Herman Miller** (malla + respaldo con struts en Y, base de 5 estrellas) — `Furniture.tsx`.
- **Monitor curvo ultrawide** (3 segmentos) + laptop sobre **escritorio blanco bench**.
- **Video wall**: panel bronce + grilla de pantallas azules + **credenza blanca** debajo.
- **Environment** (reflejos PBR, offline) + **ContactShadows** (sombras suaves).

## 🧱 Stack

Vite + React + TS + @react-three/fiber + @react-three/drei + three. Sin backend. Build en Vercel.

## 🚀 Local

```bash
npm install
npm run dev
npm run build
```

## ☁️ Deploy

Vercel detecta `vercel.json` (Vite). Root Directory = carpeta con `package.json`.

## 📐 Ajustar

Zonas en `src/data/vmcPiso16.ts` (`x,y,w,h` en mm), o desde el Inspector (Editar) → Exportar JSON.
