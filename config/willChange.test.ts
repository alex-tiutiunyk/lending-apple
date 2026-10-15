import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { compileString } from 'sass'
import { describe, expect, it } from 'vitest'

const root = process.cwd()
const stylesDirectory = join(root, 'src/styles')
// Promote while awake, demote at rest (plan 6 rule 6): a will-change may sit only under one of
// these gates, so a layer exists while its element moves and not for the life of the page
const gates = ['[data-awake]', '[data-near]', '[data-visible]', '[data-state=', '[data-phase]']

function* scssFiles(directory: string): Generator<string> {
  for (const entry of readdirSync(directory)) {
    const path = join(directory, entry)
    if (statSync(path).isDirectory()) yield* scssFiles(path)
    else if (entry.endsWith('.scss') && !entry.startsWith('_')) yield path
  }
}

/** The selectors of every rule that declares will-change, from the compiled CSS. */
function willChangeSelectors(css: string) {
  const selectors: string[] = []
  const rule = /([^{}]+)\{([^{}]*)\}/g
  for (const match of css.matchAll(rule)) {
    const [, selector = '', body = ''] = match
    if (/will-change\s*:/.test(body)) selectors.push(selector.replace(/\s+/g, ' ').trim())
  }
  return selectors
}

describe('will-change sits under an awake, near, visible or state gate (plan 6 §9)', () => {
  const files = [...scssFiles(join(root, 'src'))]

  it('finds the stylesheets', () => {
    expect(files.length).toBeGreaterThan(20)
  })

  for (const file of files) {
    it(relative(root, file), () => {
      const css = compileString(readFileSync(file, 'utf8'), {
        loadPaths: [stylesDirectory],
        url: new URL(`file://${file.replace(/\\/g, '/')}`),
      }).css
      const bare = willChangeSelectors(css).filter(
        (selector) => !gates.some((gate) => selector.includes(gate)),
      )
      expect(bare).toEqual([])
    })
  }
})
