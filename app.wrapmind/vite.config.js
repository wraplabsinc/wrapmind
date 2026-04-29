import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { sentryVitePlugin } from '@sentry/vite-plugin'

export default defineConfig({
  build: {
    sourcemap: true,
  },
  define: {
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(process.env.npm_package_version),
  },
  server: {
    allowedHosts: ['wrapos.cloud'],
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'pwa-192x192.svg'],
      manifest: {
        name: 'Wrapmind',
        short_name: 'Wrapmind',
        description: 'Automotive shop management',
        theme_color: '#1B2A3E',
        background_color: '#0F1923',
        display: 'standalone',
        icons: [
          { src: 'pwa-192x192.svg', sizes: '192x192', type: 'image/svg+xml' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
        skipWaiting: true,
        clientsClaim: true,
      },
      devOptions: {
        enabled: false,
      },
    }),
    sentryVitePlugin({
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT ?? 'wrapmind-frontend',
      authToken: process.env.SENTRY_AUTH_TOKEN,
      disable: !process.env.SENTRY_AUTH_TOKEN,
    }),
  ],
})
