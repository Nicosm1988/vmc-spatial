import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Configuración de Vite para VMC Spatial Studio.
// Vercel detecta este archivo automáticamente y ejecuta `vite build` en la nube.
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist',
    // Evita que el warning de chunks grandes rompa el build.
    chunkSizeWarningLimit: 1500,
  },
})
