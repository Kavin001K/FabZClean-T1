import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Plugin to generate version.json on build - ensures each deployment has a unique version
function versionPlugin() {
  return {
    name: 'version-plugin',
    closeBundle() {
      const version = {
        version: `2.0.${Date.now()}`,
        buildTime: new Date().toISOString(),
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
    minify: 'esbuild',
    target: 'es2020',
    // Let Vite/Rollup handle chunking automatically - it's smarter about dependencies
    // Manual chunking with functions can break React's internal module resolution
    rollupOptions: {
      output: {
        // Use a function that keeps React ecosystem packages together and doesn't
        // separate internal dependencies
        manualChunks: (id) => {
          // Keep ALL React-related packages together (react, react-dom, scheduler, react-is, etc.)
          if (id.includes('node_modules')) {
            if (
              id.includes('/react/') ||
              id.includes('/react-dom/') ||
              id.includes('/scheduler/') ||
              id.includes('/react-is/') ||
              id.includes('react-refresh')
            ) {
              return 'react-vendor';
            }
            // DO NOT manually chunk recharts - it has internal circular dependencies
            // that cause "Cannot access 'X' before initialization" errors in production
            // PDF generation - heavy
            if (id.includes('jspdf') || id.includes('html2canvas')) {
              return 'pdf';
            }
            // Animation
            if (id.includes('framer-motion')) {
              return 'framer';
            }
            // Don't create a catch-all vendor chunk - let Vite decide
          }
          // Return undefined for everything else - let Vite handle it
          return undefined;
        },
      },
    },
    chunkSizeWarningLimit: 1500,
  },
  esbuild: {
    target: 'es2020',
    logOverride: { 'this-is-undefined-in-esm': 'silent' },
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'scheduler',
      'recharts',
    ],
  },
  server: {
    fs: {
      strict: false,
    },
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
        secure: false,
      },
      '/uploads': {
        target: 'http://localhost:5001',
        changeOrigin: true,
        secure: false,
      }
    }
  },
});