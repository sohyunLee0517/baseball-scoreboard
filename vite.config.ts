import { defineConfig, loadEnv, type ViteDevServer } from 'vite'
import react from '@vitejs/plugin-react'
import { mockScoreboardApiMiddleware } from './vite-plugin-mock-api'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const useMock = env.VITE_DISABLE_SCOREBOARD_MOCK !== 'true'
  const proxyTarget = env.VITE_SCOREBOARD_API_PROXY_TARGET

  return {
    plugins: [
      react(),
      ...(useMock
        ? [
            {
              name: 'mock-scoreboard-api',
              configureServer(server: ViteDevServer) {
                server.middlewares.use(mockScoreboardApiMiddleware())
              },
            },
          ]
        : []),
    ],
    base: '/scoreboard/',
    server: {
      port: 5174,
      strictPort: true,
      ...(proxyTarget
        ? {
            proxy: {
              '/api/scoreboard': {
                target: proxyTarget,
                changeOrigin: true,
              },
            },
          }
        : {}),
    },
  }
})
