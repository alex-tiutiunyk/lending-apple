// Serves the build as an engine without scroll timelines sees it (plan 11 §10), for the
// `desktop-no-timelines` e2e project: the iPad (Safari 18) runs the JS fallback, Chromium cannot
// be told to, so every `@supports (animation-timeline: …)` is made false and every
// `@supports not (…)` true, and `CSS.supports` answers the same in JS.
import { readFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../dist/', import.meta.url))
const port = Number(process.argv[2] ?? 4174)
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json',
}
const supportsPatch = `<script>(() => {
  const supports = CSS.supports.bind(CSS)
  CSS.supports = (...args) => !/animation-timeline/.test(args.join(':')) && supports(...args)
})()</script>`

function rewrite(path, body) {
  if (path.endsWith('.css')) {
    return body
      .toString('utf8')
      .replace(/@supports( not)? ?\(animation-timeline:/g, '@supports$1 (x-no-timeline:')
  }
  if (path.endsWith('.html'))
    return body.toString('utf8').replace('<head>', `<head>${supportsPatch}`)
  return body
}

createServer(async (request, response) => {
  const pathname = decodeURIComponent(new URL(request.url ?? '/', 'http://x').pathname)
  const relativePath = pathname.endsWith('/') ? `${pathname}index.html` : pathname
  const path = normalize(join(root, relativePath))
  if (!path.startsWith(normalize(root))) {
    response.writeHead(403).end()
    return
  }
  try {
    const body = rewrite(path, await readFile(path))
    response.writeHead(200, { 'content-type': types[extname(path)] ?? 'application/octet-stream' })
    response.end(body)
  } catch {
    response.writeHead(404).end()
  }
}).listen(port, () => console.log(`no-timelines build on http://localhost:${port}`))
