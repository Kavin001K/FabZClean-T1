/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";


// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Plugin to generate version.json on build
function versionPlugin() {
  return {
    name: 'version-plugin',
    closeBundle() {
      const version = {
        version: `2.0.${Date.now()}`,
        buildTime: new Date().toISOString()
      };
      // Write to dist folder (output directory relative to root)
      const versionPath = path.resolve(__dirname, 'dist', 'version.json');
      try {
        fs.writeFileSync(versionPath, JSON.stringify(version, null, 2));
        console.log('📄 Generated version.json:', version.version);
      } catch (err) {
        console.warn('⚠️ Could not generate version.json:', err);
      }
    }
  };
}
export default defineConfig({
  plugins: [react(), versionPlugin()],
  define: {
    global: 'globalThis'
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared"),
      "@assets": path.resolve(__dirname, "attached_assets")
    }
  },
  root: "client",
  build: {
    outDir: "../dist",
    emptyOutDir: true,
    sourcemap: false,
    minify: 'esbuild',
    chunkSizeWarningLimit: 1500,
    target: 'es2020',
    rollupOptions: {
      output: {
        // Safe chunking - keep React ecosystem together, don't create catch-all vendor
        manualChunks: id => {
          if (id.includes('node_modules')) {
            // Keep ALL React-related packages together
            // This includes react, react-dom, scheduler, react-is, etc.
            if (id.includes('/react/') || id.includes('/react-dom/') || id.includes('/scheduler/') || id.includes('/react-is/') || id.includes('react-refresh')) {
              return 'react-vendor';
            }
            // React Query / TanStack
            if (id.includes('@tanstack/react-query')) {
              return 'tanstack';
            }
            // DO NOT manually chunk recharts - it has internal circular dependencies
            // that cause "Cannot access 'X' before initialization" errors in production
            // Date utilities
            if (id.includes('date-fns')) {
              return 'date-utils';
            }
            // Supabase
            if (id.includes('@supabase/')) {
              return 'supabase';
            }
            // PDF/Print - heavy
            if (id.includes('jspdf') || id.includes('html2canvas')) {
              return 'pdf';
            }
            // Animation
            if (id.includes('framer-motion')) {
              return 'animation';
            }
            // DO NOT add a catch-all vendor chunk - it breaks React
            // Let Vite handle remaining modules automatically
          }
          return undefined;
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    }
  },
  esbuild: {
    logOverride: {
      'this-is-undefined-in-esm': 'silent'
    },
    target: 'es2020',
    drop: ['console', 'debugger'],
    legalComments: 'none'
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'scheduler', 'recharts']
  },
  server: {
    fs: {
      strict: false
    },
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin'
    },
    hmr: {}
  }
});