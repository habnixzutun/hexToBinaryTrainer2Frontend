import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  base: '/trainer/',
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: ['server.albecker.eu', "localhost"],
    watch: {
      usePolling: true, // Nötig, wenn HMR in Docker/WSL2 nicht reagiert
    },
  },
})