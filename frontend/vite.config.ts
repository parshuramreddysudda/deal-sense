import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // During local dev, forward /api/* to the Express wrapper on :3001.
      // In production (Vercel), /api/* is served by serverless functions and
      // no proxy is needed — the frontend talks to same-origin paths.
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
