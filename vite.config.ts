import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { mockScoreboardApiMiddleware } from './vite-plugin-mock-api'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'mock-scoreboard-api',
      configureServer(server) {
        server.middlewares.use(mockScoreboardApiMiddleware())
      },
    },
  ],
  base: '/scoreboard/',
  server: {
    port: 5174,
    strictPort: true,
    // Dev: in-memory mock in vite-plugin-mock-api.ts. For a real API, run it and set:
    // proxy: { '/api': 'http://localhost:3001' }
  },
})
