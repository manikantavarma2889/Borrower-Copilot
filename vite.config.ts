import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailcss from 'tailwindcss'
import autoprefixer from 'autoprefixer'

export default defineConfig({
  plugins: [react()],
  css: {
    postcss: {
      plugins: [tailcss(), autoprefixer()],
    },
  },
  server: {
    open: true,
  },
})