import { defineConfig, devices } from '@playwright/test'

const skipPerf = { grepInvert: /@perf/ }

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  reporter: 'list',
  use: { baseURL: 'http://localhost:4173' },
  webServer: {
    command: 'npm run preview -- --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: true,
  },
  projects: [
    { name: 'desktop', ...skipPerf, use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', ...skipPerf, use: { ...devices['Pixel 7'] } },
    { name: 'firefox', ...skipPerf, use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit-ipad', ...skipPerf, use: { ...devices['iPad Pro 11 landscape'] } },
    { name: 'webkit-iphone', ...skipPerf, use: { ...devices['iPhone 15'] } },
    { name: 'perf', grep: /@perf/, use: { ...devices['Desktop Chrome'] } },
  ],
})
