# VMC Spatial Studio · Piso 16 (3D realista · distribución CAD)

Gemelo espacial del **Piso 16 (VMC)** de YPF — Torre YPF, Puerto Madero. Vista 3D con **React Three Fiber + Drei**.

## 🧭 Orientación (definida)

- **FRENTE = Este** (punta derecha, Río de la Plata) → **3 oficinas**: la del **centro más grande** + 2 chicas (Norte y Sur).
- **FONDO = Oeste** (Juana Manso, ciudad).
- **LADOS = Norte** (Macacha Güemes) / **Sur** (Manuela Sáenz).
- Etiquetas 3D flotantes (FRENTE / FONDO / LADO N / LADO S) + bandas de piso teal (frente) y azul (fondo).

## 🪑 Muebles (según fotos)

- **Silla Herman Miller** (malla, respaldo con struts en Y, base 5 estrellas).
- **Monitor curvo ULTRAWIDE ENTERO** (un solo panel cóncavo, no partido) sobre escritorio blanco bench + laptop.
- **Video wall**: panel bronce + grilla de pantallas + **credenza blanca** debajo.

## 🗺️ Distribución (plano CAD)

Núcleo central **en cruz** con 4 Video Walls. Perímetro (islas de escritorios):
- **Norte:** Data & Information Excellence · Machine Learning & AI · Performance · Control Tower
- **Sur:** Operational License & Excellence · Control Execution ×2 · Business Digital Twin
- **Frente (Este):** 3 oficinas · **Oeste:** 2 salas de reunión · **Esquinas:** 2 pods redondos.

## 🧱 Stack

Vite + React + TS + @react-three/fiber + @react-three/drei + three. Build en Vercel.

## 🚀 Local
```bash
npm install && npm run dev
```
## ☁️ Deploy
Vercel detecta `vercel.json` (Vite). Root Directory = carpeta con `package.json`.
