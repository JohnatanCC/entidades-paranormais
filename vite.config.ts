import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import { mapsDevApi } from './tools/mapsDevApi'

const root = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  plugins: [react(), mapsDevApi(root)],
})
