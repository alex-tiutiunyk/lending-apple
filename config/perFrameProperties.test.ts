import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = process.cwd()

// Custom properties JavaScript writes once per event, not per frame (plan 6 rule 1): the fill
// origin on a button enter, the breath clock on a wake, the word count on mount, a finish pick
const oncePerEvent = [
  '--fill-x',
  '--fill-y',
  '--breath-delay',
  '--words',
  '--accent-h',
  '--accent-s',
  '--accent-l',
  '--text-scale',
  // The nav runner's hop is laid out once per section change
  '--runner-x',
  '--middle-scale',
  '--end-x',
  // Plan 8: a runaway copy's leg lift when it is made, the blueprint's scale once per layout
  '--leg-lift',
  '--outline-scale',
]

function* sourceFiles(directory: string): Generator<string> {
  for (const entry of readdirSync(directory)) {
    const path = join(directory, entry)
    if (statSync(path).isDirectory()) yield* sourceFiles(path)
    else if (/\.(ts|tsx)$/.test(entry) && !/\.test\.tsx?$/.test(entry)) yield path
  }
}

function registeredNonInherited(globalScss: string) {
  const names = new Set<string>()
  const block = /@property\s+(--[\w-]+)\s*\{([^}]*)\}/g
  for (const match of globalScss.matchAll(block)) {
    const [, name = '', body = ''] = match
    if (/inherits\s*:\s*false/.test(body)) names.add(name)
  }
  return names
}

describe('every custom property written from JavaScript is registered non-inherited (plan 6 rule 1)', () => {
  const registered = registeredNonInherited(
    readFileSync(join(root, 'src/styles/global.scss'), 'utf8'),
  )
  const writes = new Map<string, string[]>()
  for (const file of sourceFiles(join(root, 'src'))) {
    const source = readFileSync(file, 'utf8')
    for (const match of source.matchAll(/setProperty\(\s*['"`](--[\w-]+)/g)) {
      const name = match[1] ?? ''
      writes.set(name, [...(writes.get(name) ?? []), relative(root, file)])
    }
  }

  it('finds the writes', () => {
    expect(writes.size).toBeGreaterThan(0)
  })

  for (const [name, files] of writes) {
    it(`${name} (${files.join(', ')})`, () => {
      expect(oncePerEvent.includes(name) || registered.has(name)).toBe(true)
    })
  }
})
