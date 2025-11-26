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
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-popover', '@radix-ui/react-select']
        }
      }
    }
  },
  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' },
    target: 'es2020',
    drop: ['console', 'debugger'],
  },
  server: {
    port: 5000, // Frontend runs on 5000
    fs: {
      strict: false,
    },
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
    },
    hmr: {
      clientPort: 5000, // Force HMR to use the frontend port, not the backend
    },
    proxy: {
      '/api': {
        target: 'http://localhost:5001', // Backend is on 5001
        changeOrigin: true,
        secure: false,
      },
      // WebSocket proxy for backend real-time connections
      '/ws': {
        target: 'ws://localhost:5001',
        ws: true,
        changeOrigin: true,
      },
    },
  },
});
