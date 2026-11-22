/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { resolve } from 'path';
import salesforce from '@salesforce/vite-plugin-ui-bundle';

/**
 * The @salesforce/vite-plugin-ui-bundle plugin bakes `__SF_API_VERSION__` from
 * the CLI *default org's* apiVersion at build time (else "65.0"). But ONE `dist/`
 * is deployed to many orgs on different Salesforce releases (incl. Trialforce
 * spawns), so a version pulled from a newer build-machine org (e.g. v68) 404s on
 * an older org's `/services/data/v68.0/ui-api/session/csrf`, which cascades to
 * 401 "Session expired or invalid token usage" on every apexrest call.
 *
 * Pin the SDK's data-API version to a conservative floor that every target org
 * supports (the session/csrf + apexrest calls are version-agnostic in behavior),
 * so the build is reproducible and org-independent. `enforce: 'post'` guarantees
 * this define wins over the salesforce plugin's `enforce: 'pre'` one.
 */
const PINNED_SF_API_VERSION = '65.0';
const pinSfApiVersion: import('vite').Plugin = {
  name: 'pin-sf-api-version',
  enforce: 'post',
  config: () => ({ define: { __SF_API_VERSION__: JSON.stringify(PINNED_SF_API_VERSION) } }),
};

export default defineConfig({
  base: './',
  plugins: [react(), salesforce(), pinSfApiVersion] as import('vite').PluginOption[],

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
