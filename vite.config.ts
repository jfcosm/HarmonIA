import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Defines process.env to prevent crashes in code relying on it,
    // though import.meta.env is preferred in Vite.
    'process.env': {}
  }
})