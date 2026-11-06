import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Every request to /api is forwarded to Spring Boot, so no CORS setup is needed in development
    proxy: {
      '/api': 'http://localhost:8080',
    },
  },
})