/**
 * VITE.CONFIG.JS - Configuración del build tool de VocAcción
 * 
 * PROPÓSITO:
 * Configura Vite como herramienta de desarrollo y build del proyecto.
 * Define plugins, alias de importación y configuración del servidor.
 * 
 * CONFIGURACIÓN ACTUAL:
 * - Plugin de React para JSX y fast refresh
 * - Plugin de Tailwind CSS integrado 
 * - Alias "@" que apunta a "./src" para imports limpios
 * 
 * COLABORADORES:
 * Para añadir nuevos plugins, importadlos y añadidlos al array plugins
 * Para crear nuevos alias, añadidlos en resolve.alias
 * NO cambiar la configuración sin consultar al equipo
 */

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

// Configuración de Vite - Ver documentación: https://vite.dev/config/
export default defineConfig({
  // Plugins activos del proyecto
  plugins: [
    tailwindcss(), // Integración nativa de Tailwind CSS 4.x
    react()        // Soporte para JSX y Fast Refresh
  ],
  
  // Configuración de resolución de rutas
  resolve: {
    alias: {
      // Alias "@" permite usar "@/components" en lugar de "./src/components"
      "@": fileURLToPath(new URL('./src', import.meta.url))
    },
  },
})
// Config refresh forced
