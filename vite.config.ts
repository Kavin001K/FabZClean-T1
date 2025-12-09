import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    react(),
  ],
  define: {
    global: 'globalThis',
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared"),
      "@assets": path.resolve(__dirname, "attached_assets"),
    },
  },
  root: "client",
  build: {
    outDir: "../dist",
    emptyOutDir: true,
    sourcemap: false,
    minify: 'esbuild',
    chunkSizeWarningLimit: 600, // Reduced from 1000
    target: 'es2020',
    rollupOptions: {
      output: {
        // Better code splitting for smaller chunks
        manualChunks: (id) => {
          // React core
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
            return 'react-vendor';
          }
          // React Query / TanStack
          if (id.includes('@tanstack/react-query')) {
            return 'tanstack';
          }
          // UI Components (Radix)
          if (id.includes('@radix-ui/')) {
            return 'radix-ui';
          }
          // Charts
          if (id.includes('recharts') || id.includes('d3-')) {
            return 'charts';
          }
          // Date utilities
          if (id.includes('date-fns') || id.includes('dayjs') || id.includes('luxon')) {
            return 'date-utils';
          }
          // Supabase
          if (id.includes('@supabase/')) {
            return 'supabase';
          }
          // Form handling
          if (id.includes('react-hook-form') || id.includes('zod') || id.includes('@hookform/')) {
            return 'forms';
          }
          // Icons
          if (id.includes('lucide-react')) {
            return 'icons';
          }
          // PDF/Print
          if (id.includes('jspdf') || id.includes('html2canvas')) {
            return 'pdf';
          }
          // Animation
          if (id.includes('framer-motion')) {
            return 'animation';
          }
          // Other vendor libraries
          if (id.includes('node_modules/')) {
            return 'vendor';
          }
        },
        // Optimize chunk file names
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      }
    }
  },
  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' },
    target: 'es2020',
    drop: ['console', 'debugger'],
    legalComments: 'none', // Remove license comments to reduce size
  },
  server: {
    fs: {
      strict: false,
    },
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
    },
    hmr: {
      // clientPort: 5000, // Removed to allow auto-detection
    },
  },
});

