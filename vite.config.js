import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { quasar, transformAssetUrls } from '@quasar/vite-plugin';
import VueI18nPlugin from '@intlify/unplugin-vue-i18n/vite';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(async () => ({
    plugins: [
        vue({ template: { transformAssetUrls }}),
        quasar(),
        VueI18nPlugin({
            include: [path.resolve(__dirname, './src/i18n/locales/**')],
            fullInstall: false,
            compositionOnly: true,
        })
    ],

    // Configuration of the @ alias for better readability and maintainability
    resolve: {
        alias: {
          '@': path.resolve(__dirname, './src'),
        },
    },

    // Vite options tailored for Tauri development
    clearScreen: false,
    server: {
        port: 1420,
        strictPort: true,
    },
    envPrefix: ["VITE_"],

    build: {
        target: process.env.TAURI_PLATFORM == "windows" ? "chrome105" : "safari13",
        minify: !process.env.TAURI_DEBUG ? "esbuild" : false,
        sourcemap: !!process.env.TAURI_DEBUG,
    },

    test: {
        globals: true,
        environment: 'node',
        setupFiles: ['./tests/setup.js'],
        alias: {
            '@': path.resolve(__dirname, './src')
        }
    }
}));
