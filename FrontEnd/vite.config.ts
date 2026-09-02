import { sites } from '@openai/sites-vite-plugin'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig(async () => {
  process.env.WRANGLER_WRITE_LOGS ??= 'false'
  process.env.WRANGLER_LOG_PATH ??= '.wrangler/logs'
  process.env.MINIFLARE_REGISTRY_PATH ??= '.wrangler/registry'

  const { cloudflare } = await import('@cloudflare/vite-plugin')
  const base =
    process.env.VITE_BASE_PATH ??
    (process.env.GITHUB_ACTIONS ? '/FlowerWeb/' : '/')

  return {
    base,
    plugins: [
      react(),
      sites(),
      cloudflare({ viteEnvironment: { name: 'server' } }),
    ],
  }
})
