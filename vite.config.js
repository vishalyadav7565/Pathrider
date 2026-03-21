import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://3.26.155.202:8000',  // Django backend
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
