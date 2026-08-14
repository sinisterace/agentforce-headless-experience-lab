/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { resolve } from 'path';
import salesforce from '@salesforce/vite-plugin-ui-bundle';

export default defineConfig({
  base: './',
  plugins: [react(), salesforce()] as import('vite').PluginOption[],

  build: {
    outDir: resolve(__dirname, 'dist'),
    assetsDir: 'assets',
    sourcemap: false,
    cssMinify: 'esbuild',
    chunkSizeWarningLimit: 1024,
  },

  resolve: {
    dedupe: ['react', 'react-dom'],
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  test: {
    root: resolve(__dirname),
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    globals: true,
  },
});
