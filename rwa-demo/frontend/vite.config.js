import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/auth': 'http://localhost:4000',
      '/bonds': 'http://localhost:4000',
      '/portfolio': 'http://localhost:4000',
      '/buy': 'http://localhost:4000',
      '/redeem': 'http://localhost:4000'
    }
  }
})
