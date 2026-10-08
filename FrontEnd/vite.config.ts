import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig(() => {
  const base =
    process.env.VITE_BASE_PATH ??
    (process.env.GITHUB_ACTIONS ? '/FlowerWeb/' : '/')

  return {
    base,
    plugins: [react()],
  }
})
