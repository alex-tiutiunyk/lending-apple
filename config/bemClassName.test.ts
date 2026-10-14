import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { bemNamePattern, bemScopedName, blockName, keyframeNames } from './bemClassName'

function moduleFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) return moduleFiles(path)
    return entry.name.endsWith('.module.scss') ? [path] : []
  })
}

function localNames(scss: string) {
  const withoutStrings = scss.replace(/url\([^)]*\)|'[^']*'|"[^"]*"/g, '')
  const classes = Array.from(withoutStrings.matchAll(/(?<![\w-])\.([a-z][\w-]*)/gi), (m) => m[1])
  return new Set([...classes, ...keyframeNames(scss)].filter((name) => name !== undefined))
}

const modules = moduleFiles('src')
const globalKeyframes = keyframeNames(readFileSync('src/styles/global.scss', 'utf8'))

describe('BEM class names', () => {
  it('maps root, elements and modifiers', () => {
    const file = 'src/components/PressableLink/PressableLink.module.scss'
    expect(bemScopedName('root', file)).toBe('pressable-link')
    expect(bemScopedName('root--compact', file)).toBe('pressable-link--compact')
    expect(bemScopedName('hover-ring', file)).toBe('pressable-link__hover-ring')
    expect(bemScopedName('render--tilt-odd', 'Finishes.module.scss')).toBe(
      'finishes__render--tilt-odd',
    )
    expect(bemScopedName('reveal-rise', file, new Set(['reveal-rise']))).toBe('reveal-rise')
  })

  it('gives every module its own block', () => {
    const blocks = modules.map(blockName)
    expect(new Set(blocks).size).toBe(blocks.length)
  })

  it('produces only names that match the pattern', () => {
    const bad = modules.flatMap((file) =>
      [...localNames(readFileSync(file, 'utf8'))]
        .map((local) => bemScopedName(local, file, globalKeyframes))
        .filter((name) => !bemNamePattern.test(name)),
    )
    expect(bad).toEqual([])
  })
})
