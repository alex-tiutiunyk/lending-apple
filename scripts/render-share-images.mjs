import { chromium } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const siteUrl = process.argv[2] ?? 'http://localhost:4173'
const publicDir = fileURLToPath(new URL('../public/', import.meta.url))
const markSvg = readFileSync(new URL('../public/favicon.svg', import.meta.url), 'utf8')

const browser = await chromium.launch()

const share = await browser.newPage({ viewport: { width: 1200, height: 630 } })
await share.emulateMedia({ reducedMotion: 'reduce' })
await share.goto(siteUrl, { waitUntil: 'networkidle' })
await share.addStyleTag({ content: 'header, aside, .a11y-panel { display: none }' })
await share.screenshot({ path: `${publicDir}og-image.jpg`, type: 'jpeg', quality: 86 })

const icon = await browser.newPage()
for (const [file, size] of [
  ['favicon-32.png', 32],
  ['apple-touch-icon.png', 180],
]) {
  await icon.setViewportSize({ width: size, height: size })
  await icon.setContent(
    `<style>html,body{margin:0;background:transparent}svg{width:${size}px;height:${size}px;display:block}</style>${markSvg}`,
  )
  await icon.screenshot({ path: `${publicDir}${file}`, omitBackground: true })
}

await browser.close()
