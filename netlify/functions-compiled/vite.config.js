"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vite_1 = require("vite");
const plugin_react_1 = __importDefault(require("@vitejs/plugin-react"));
const path_1 = __importDefault(require("path"));
exports.default = (0, vite_1.defineConfig)({
    plugins: [
        (0, plugin_react_1.default)(),
    ],
    resolve: {
        alias: {
            "@": path_1.default.resolve(import.meta.dirname, "client", "src"),
            "@shared": path_1.default.resolve(import.meta.dirname, "shared"),
            "@assets": path_1.default.resolve(import.meta.dirname, "attached_assets"),
        },
    },
    root: "client",
    build: {
        outDir: "../dist",
        emptyOutDir: true,
        rollupOptions: {
            external: ['shelljs'],
            output: {
                globals: {
                    shelljs: 'shell'
                }
            }
        }
    },
    server: {
        fs: {
            strict: false,
        },
        headers: {
            'Cross-Origin-Embedder-Policy': 'require-corp',
            'Cross-Origin-Opener-Policy': 'same-origin',
        },
        proxy: {
            '/api': {
                target: 'http://localhost:3000',
                changeOrigin: true,
                secure: false,
            },
        },
    },
});
