import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
// import { viteCommonjs } from '@originjs/vite-plugin-commonjs'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // plugins: [viteCommonjs(), react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
    preserveSymlinks: true
  },
  build: {
  },
  server: {
    proxy: {
      '/vink.kubevm.io.apis': {
        target: 'http://192.168.18.240:8080',
        // target: 'http://127.0.0.1:8080',
        changeOrigin: true,
      },
      '/apis': {
        target: 'http://127.0.0.1:9090',
        changeOrigin: true,
        ws: true,
      }
    }
  }
})
