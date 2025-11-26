import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
// Build Timestamp: 1.8.2 Force Update
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
    plugins: [react()],
    define: {
      // Explicitly inject the API_KEY from Vercel environment into the code
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
      // Fallback for other process.env accesses to prevent browser crashes
      'process.env': {}
    }
  }
})