import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = process.cwd()
const appFile = join(root, 'src/app/App.tsx')
// The stylesheet that declares the fixed layers themselves and the skip link, which needs no layer
const exempt = new Set(['src/app/App.module.scss'])

function* scssFiles(directory: string): Generator<string> {
  for (const entry of readdirSync(directory)) {
    const path = join(directory, entry)
    if (statSync(path).isDirectory()) yield* scssFiles(path)
    else if (entry.endsWith('.module.scss')) yield path
  }
}

/** The directories of the components `App.tsx` renders inside `.over` and `.under`. */
function layerDirectories() {
  const source = readFileSync(appFile, 'utf8')
  const imports = new Map(
    Array.from(source.matchAll(/import \{ (\w+) \} from '@\/([^']+)'/g), ([, name, path]) => [
      name ?? '',
      dirname(resolve(root, 'src', path ?? '')),
    ]),
  )
  const layers = source.matchAll(
    /<div className=\{styles\.(?:over|under)\}[^>]*>([\s\S]*?)<\/div>/g,
  )
  const directories = new Set<string>()
  for (const [, body = ''] of layers) {
    for (const [, name = ''] of body.matchAll(/<([A-Z]\w*)/g)) {
      const directory = imports.get(name)
      if (directory) directories.add(directory)
    }
  }
  return directories
}

/** A component that renders itself into the fixed layer through a portal. */
function portalsIntoLayer(stylesheet: string) {
  const component = stylesheet.replace(/\.module\.scss$/, '.tsx')
  if (!existsSync(component)) return false
  const source = readFileSync(component, 'utf8')
  return source.includes('createPortal(') && source.includes('[data-fixed-layer]')
}

describe('every fixed element lives in a fixed layer (plan 11 §2)', () => {
  const directories = layerDirectories()
  const fixed = [...scssFiles(join(root, 'src'))].filter(
    (file) =>
      /position:\s*fixed/.test(readFileSync(file, 'utf8')) &&
      !exempt.has(relative(root, file).replaceAll('\\', '/')),
  )

  it('finds the layers and the fixed stylesheets', () => {
    expect(directories.size).toBeGreaterThan(4)
    expect(fixed.length).toBeGreaterThan(4)
  })

  for (const file of fixed) {
    it(relative(root, file), () => {
      const isInLayer = directories.has(dirname(file)) || portalsIntoLayer(file)
      expect(isInLayer, 'render it inside .over or .under in App.tsx, or portal it there').toBe(
        true,
      )
    })
  }
})
