import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  server: {
    port: 5173,
    host: true, // Permite acesso de qualquer IP (0.0.0.0)
    open: true,
    cors: true, // Habilita CORS
    allowedHosts: [
      '.loca.lt', // Permite todos os subdomínios do LocalTunnel
      'localhost'
    ],
    proxy: {
      // Se a API URL for relativa, proxy para o backend
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:3000',
        changeOrigin: true,
        secure: false
      }
    },
    hmr: {
      overlay: true
    },
    // Force reload CSS
    watch: {
      usePolling: true
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    // Disable CSS code splitting to ensure all CSS loads together
    cssCodeSplit: false,
    // Clear output dir before build
    emptyOutDir: true,
    // Multi-page build configuration
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        admin: resolve(__dirname, 'admin.html'),
        empresa: resolve(__dirname, 'empresa.html'),
        cliente: resolve(__dirname, 'cliente.html'),
        painelEmpresa: resolve(__dirname, 'painel-empresa.html')
      }
    }
  },
  // Copy public files to dist
  publicDir: 'public',
  // Disable CSS minification in dev to ensure proper loading
  css: {
    devSourcemap: true
  },
  // Clear cache on startup
  cacheDir: '.vite'
});
