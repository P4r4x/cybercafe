import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from "path"
import { fileURLToPath } from 'url'
import fs from "fs"

// Fix for __dirname in ESM when running vite config in Node
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  server: {
    https: {
      key: fs.readFileSync("cert/cybercafe.test+1-key.pem"),
      cert: fs.readFileSync("cert/cybercafe.test+1.pem"),
    },
    host: '127.0.0.1',
    port: 9017,
    strictPort: true,
        hmr: {
      protocol: "wss",
      host: "app.cybercafe.test",
      port: 9017,
    },
  }
})
