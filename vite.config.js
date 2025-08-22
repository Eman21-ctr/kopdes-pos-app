import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa' // <-- 1. Impor plugin PWA

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // 2. Tambahkan plugin VitePWA dengan konfigurasinya
    VitePWA({
      registerType: 'autoUpdate', // Otomatis update PWA saat ada versi baru
      manifest: {
        // --- Ganti informasi ini sesuai aplikasi Anda ---
        name: 'POS KDMP Penfui Timur', // Nama lengkap aplikasi
        short_name: 'POS Kopdes',          // Nama pendek untuk ikon di homescreen
        description: 'Aplikasi Point of Sale untuk Koperasi Desa Merah Putih Penfui Timur',
        theme_color: '#DC2626',             // Warna tema (misalnya merah, sesuaikan)
        background_color: '#ffffff',     // Warna layar splash
        // ---------------------------------------------
        display: 'standalone',
        scope: '/',
        start_url: '/',
        orientation: 'portrait',
        icons: [
          {
            src: '/icons/pwa-192x192.png', // Path ke ikon di folder /public/icons
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icons/pwa-512x512.png', // Path ke ikon di folder /public/icons
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: '/icons/pwa-512x512.png', // Ikon yang bisa di-masking (penting untuk Android)
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      }
    })
  ],
})