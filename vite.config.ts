import { readFileSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import type { Plugin } from 'vite'
import { defineConfig } from 'vitest/config'
import { bemScopedName, keyframeNames } from './config/bemClassName'
import { finishHeadScript } from './src/components/Finishes/finishStorage'
import { settingsHeadScript } from './src/hooks/a11ySettings'

const globalStylesheet = fileURLToPath(new URL('./src/styles/global.scss', import.meta.url))
const globalKeyframes = keyframeNames(readFileSync(globalStylesheet, 'utf8'))

/** Applies the remembered finish and reading settings in `<head>`, before the first paint (dev and build). */
function rememberedFinish(): Plugin {
  return {
    name: 'remembered-finish',
    transformIndexHtml: () => [
      { tag: 'script', children: finishHeadScript(), injectTo: 'head-prepend' },
      { tag: 'script', children: settingsHeadScript(), injectTo: 'head-prepend' },
    ],
  }
}

export default defineConfig({
  plugins: [react(), rememberedFinish()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  css: {
    modules: {
      localsConvention: 'camelCaseOnly',
      generateScopedName: (local, filename) => bemScopedName(local, filename, globalKeyframes),
    },
    preprocessorOptions: {
      scss: { loadPaths: [fileURLToPath(new URL('./src/styles', import.meta.url))] },
    },
  },
  build: { target: 'es2022', cssCodeSplit: true },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}', 'config/**/*.test.ts'],
    setupFiles: ['src/test/setup.ts'],
    css: { include: /\.module\.scss$/, modules: { classNameStrategy: 'scoped' } },
  },
})
