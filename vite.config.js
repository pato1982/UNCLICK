import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig({
  plugins: [
    react(),
    // Reporte visual del bundle: `npm run build:analyze` genera dist/stats.html
    process.env.ANALYZE &&
      visualizer({ filename: 'dist/stats.html', gzipSize: true, brotliSize: true }),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.png', 'icon-192.png', 'icon-512.png', 'icon-admin-192.png', 'icon-admin-512.png'],
      manifest: {
        name: 'LocalClick',
        short_name: 'LocalClick',
        description: 'Todo lo que necesitas está a un Click',
        theme_color: '#3B1969',
        background_color: '#3B1969',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        shortcuts: [
          {
            name: 'Mi Panel de Administración',
            short_name: 'Mi Panel',
            description: 'Accede directamente a tu panel de administración',
            url: '/admin',
            icons: [
              { src: 'icon-admin-192.png', sizes: '192x192', type: 'image/png' },
            ],
          },
        ],
      },
      workbox: {
        skipWaiting: true,
        clientsClaim: true,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https?:\/\/.*\/api\//,
            handler: 'NetworkOnly',
          },
        ],
      },
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        // Separa el vendor de React/Router en su propio chunk para mejorar el cacheo
        // a largo plazo (cambia poco entre deploys). Sentry y Leaflet ya se cargan
        // de forma diferida/bajo demanda, asi que Rollup los separa solos.
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react-router')) return 'vendor-router'
            if (id.includes('react-dom') || id.includes('/react/') || id.includes('scheduler')) return 'vendor-react'
          }
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: ['node_modules/', 'dist/', 'src/test/'],
    },
  },
  server: {
    port: 5173,
    open: true,
    watch: {
      usePolling: true,
      interval: 300,
    },
    proxy: {
      // Backend UNCLICK corre en 3002 (3001 lo ocupa wa-sender)
      '/api': {
        target: 'http://localhost:3002',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:3002',
        changeOrigin: true,
      },
    },
  },
})
