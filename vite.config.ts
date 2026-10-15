import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  base: '/trainer',
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: ['server.albecker.eu', "localhost"],
    watch: {
      usePolling: true, // Nötig, wenn HMR in Docker/WSL2 nicht reagiert
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.tsx'],
    coverage: {
      reporter: ['text', 'json-summary', 'json'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['node_modules/', 'dist/', '**/*.test.{ts,tsx}'],
      // Coverage-Schwelle ab Sprint 1 erzwungen (Sprint 0: nur Messung)
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
})
