import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  define: {
    global: 'globalThis',
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared"),
    },
  },
  root: "client",
  build: {
    outDir: "../dist",
    emptyOutDir: true,
    sourcemap: false,
    minify: true,
    target: 'es2020',
    rollupOptions: {
      output: {
        // Aggressive manual chunking for better code splitting
        manualChunks: (id) => {
          // Core React
          if (id.includes('node_modules/react-dom')) return 'react-dom';
          if (id.includes('node_modules/react/')) return 'react';

          // Charts - heavy library
          if (id.includes('recharts') || id.includes('d3-')) return 'charts';

          // PDF generation - heavy, lazy load
          if (id.includes('jspdf') || id.includes('html2canvas')) return 'pdf';

          // Animation library
          if (id.includes('framer-motion')) return 'framer';

          // UI Components - Radix
          if (id.includes('@radix-ui')) return 'radix-ui';

          // Tanstack Query
          if (id.includes('@tanstack')) return 'tanstack';

          // Supabase
          if (id.includes('@supabase')) return 'supabase';

          // Icons
          if (id.includes('lucide-react')) return 'icons';

          // Forms
          if (id.includes('react-hook-form') || id.includes('@hookform')) return 'forms';

          // Date utilities
          if (id.includes('date-fns')) return 'date-utils';

          // QR/Barcode
          if (id.includes('qrcode') || id.includes('jsbarcode')) return 'barcodes';

          // Misc vendor
          if (id.includes('node_modules')) return 'vendor';
        },
      },
    },
    chunkSizeWarningLimit: 500,
  },
  esbuild: {
    target: 'es2020',
    logOverride: { 'this-is-undefined-in-esm': 'silent' },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', '@tanstack/react-query'],
    exclude: ['@types/node'],
  },
  server: {
    fs: {
      strict: false,
    },
  },
});