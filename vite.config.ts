import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(), 
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['swiftcart-favicon.svg', 'pwa-192x192.svg', 'pwa-512x512.svg'],
      manifest: {
        name: 'SwiftCart B2B Platform',
        short_name: 'SwiftCart',
        description: 'High-performance quick commerce platform',
        theme_color: '#18181b',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: '/pwa-192x192.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          },
          {
            src: '/pwa-512x512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  build: {
    // Warn when a chunk exceeds 500 kB (helps catch regressions)
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // ── Admin-only heavy chunk ─────────────────────────────────────────
          // recharts is ONLY used by AnalyticsDashboard. Keep it isolated so
          // consumer-facing routes (home, checkout, tracking) never download it.
          if (id.includes('node_modules/recharts') ||
              id.includes('node_modules/d3-') ||
              id.includes('node_modules/victory-vendor')) {
            return 'vendor-charts';
          }

          // ── Supabase client ────────────────────────────────────────────────
          if (id.includes('node_modules/@supabase')) {
            return 'vendor-supabase';
          }

          // ── React router ───────────────────────────────────────────────────
          if (id.includes('node_modules/react-router') ||
              id.includes('node_modules/@remix-run')) {
            return 'vendor-router';
          }

          // ── Lucide icons ───────────────────────────────────────────────────
          // Large icon set — isolate so tree-shaking can work per-chunk
          if (id.includes('node_modules/lucide-react')) {
            return 'vendor-icons';
          }

          // ── React core ─────────────────────────────────────────────────────
          if (id.includes('node_modules/react') ||
              id.includes('node_modules/react-dom') ||
              id.includes('node_modules/scheduler')) {
            return 'vendor-react';
          }
        },
      },
    },
  },
})
