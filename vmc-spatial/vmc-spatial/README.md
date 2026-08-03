# VMC Spatial Studio · Piso 16 (3D realista)

Gemelo espacial **local-first** del **Piso 16 (Value Management Center)** de YPF — Torre YPF, Puerto Madero, CABA. La vista 3D usa **React Three Fiber + Drei** con muebles, materiales PBR, reflejos de entorno y sombras suaves.

Todo se deriva de **un único documento** (`src/data/vmcPiso16.ts`) en **milímetros enteros**.

> ⚠️ Maqueta conceptual. Cotas aproximadas; se ajustan contra Obra Civil (PEP 6400-25-011).

## 🫘 Planta en forma de lente (Torre Pelli)

Huella tipo **lente/almendra de ~1.600 m²**, eje largo Este–Oeste. Norte: Macacha Güemes · Sur: Manuela Sáenz · Oeste: Juana Manso · Este: Río de la Plata.

## 🪑 Nivel 1 — Realismo

- **Estaciones de trabajo reales** por puesto: escritorio + monitor emisivo + silla de oficina (`src/components/Furniture.tsx`), construidas con `RoundedBox` + materiales PBR.
- **Video walls** emisivos, **salas vidriadas**, **mesa de troubleshooting** con sillas.
- **`<Environment>` con `<Lightformer>`** → reflejos PBR **sin archivos externos** (100% offline).
- **`<ContactShadows>`** → sombras suaves de contacto que "apoyan" los muebles en el piso.
- Piso extruido desde el contorno real de la lente (`THREE.Shape` / `ExtrudeGeometry`).

### 🔜 Cómo subir a GLB reales (Kenney) más adelante
El sistema queda listo para reemplazar las estaciones por modelos GLB reales:
1. Descargá el **Furniture Kit de Kenney** (CC0, gratis): https://kenney.nl/assets/furniture-kit
2. Poné los `.glb` en `public/models/`.
3. En `Furniture.tsx`, reemplazá el contenido de `Workstation` por `useGLTF('/models/desk.glb')` + `<primitive object={scene} />`.
   Drei cachea y soporta Draco automáticamente.

## 🧩 Clusters (VMC 10.12.25)

Margen Integrado (43) · Competitividad+EO (37) · Performance (10) · Midstream (8) · Proyectos Especiales (6) · Planificación MID (6) · Núcleo con 4 Video Walls · Troubleshooting · 2 salas de reunión.

## 🎨 Paleta oficial

Azul-verde **`#0424D9 → #03C1BD`** (Look & Feel VMC).

## 🧱 Stack

Vite + React + TypeScript + **@react-three/fiber** + **@react-three/drei** + three. Sin backend. El build lo hace Vercel en la nube.

## 🚀 Local (opcional, Node 18+)

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # /dist
```

## ☁️ Deploy

Vercel detecta `vercel.json` (framework Vite) y corre `vite build` en cada push a `main`. **Root Directory** debe apuntar a la carpeta que contiene `package.json`.

## 📐 Ajustar

- Forma de la lente: `halfL`, `halfW`, `pointiness` en `src/data/vmcPiso16.ts`.
- Cada cluster: `x, y, w, h` en mm, o desde el **Inspector** (Editar) → Exportar JSON.
