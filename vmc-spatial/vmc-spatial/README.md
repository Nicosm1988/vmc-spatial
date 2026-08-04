# VMC Spatial Studio · Piso 16 (calcado del plano por CV)

Gemelo espacial del **Piso 16 (VMC)** de YPF. R3F + Drei.

## 🎯 Layout extraído por visión computacional

Las **12 islas de escritorios** se extrajeron del plano oficial (LayOut 2.0) con
OpenCV: detección de manchas por color, centroides y **orientación por PCA**.
Cada isla está en su **posición y rotación exactas** del plano (mapeo px→mm).

- Núcleo diamante con pantallas en las 4 caras (20/30/24/24).
- Mesas redondas y comedores calcados de los círculos y mesas del plano.

## 🧱 Stack
Vite + React + TS + @react-three/fiber + @react-three/drei + three. Build en Vercel.

## 🚀 Local
```bash
npm install && npm run dev
```
