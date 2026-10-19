import { defineConfig, devices } from '@playwright/test'

const skipPerf = { grepInvert: /@perf/ }

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  reporter: 'list',
  use: { baseURL: 'http://localhost:4173' },
  webServer: [
    {
      command: 'npm run preview -- --port 4173 --strictPort',
      url: 'http://localhost:4173',
      reuseExistingServer: true,
    },
    {
      command: 'node scripts/serve-no-timelines.mjs 4174',
      url: 'http://localhost:4174',
      reuseExistingServer: true,
    },
  ],
  projects: [
    { name: 'desktop', ...skipPerf, use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', ...skipPerf, use: { ...devices['Pixel 7'] } },
    { name: 'firefox', ...skipPerf, use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit-ipad', ...skipPerf, use: { ...devices['iPad Pro 11 landscape'] } },
    // The iPad mini / 10.2" width where the brand name wrapped (plan 11 §6)
    { name: 'webkit-ipad-portrait', ...skipPerf, use: { ...devices['iPad (gen 7)'] } },
    { name: 'webkit-iphone', ...skipPerf, use: { ...devices['iPhone 15'] } },
    // The scroll-timeline fallback the iPad (Safari 18) runs, forced in Chromium (plan 11 §10)
    {
      name: 'desktop-no-timelines',
      ...skipPerf,
      use: { ...devices['Desktop Chrome'], baseURL: 'http://localhost:4174' },
    },
    // Headed: headless Chromium rasterises in software, which turns GPU work into frame time
    // the page does not cause (plan 6 §1 and §13 measure headed)
    { name: 'perf', grep: /@perf/, use: { ...devices['Desktop Chrome'], headless: false } },
    { name: 'perf-mobile', grep: /@perf/, use: { ...devices['Pixel 7'], headless: false } },
  ],
})
