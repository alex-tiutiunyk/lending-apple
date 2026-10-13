import { readFileSync, rmSync, writeFileSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'

const distIndex = fileURLToPath(new URL('../dist/index.html', import.meta.url))
const serverBundleDir = fileURLToPath(new URL('../dist-ssr/', import.meta.url))
const { renderPage } = await import(pathToFileURL(`${serverBundleDir}entry-server.js`).href)

const template = readFileSync(distIndex, 'utf8')
const placeholder = '<div id="root"></div>'
if (!template.includes(placeholder)) throw new Error(`${placeholder} not found in dist/index.html`)

writeFileSync(distIndex, template.replace(placeholder, `<div id="root">${renderPage()}</div>`))
rmSync(serverBundleDir, { recursive: true, force: true })
process.stdout.write('prerendered dist/index.html\n')
