import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server:{
    open: '/login' // Abre o navegador automaticamente na rota /Login ao rodar o projeto
  }
})
