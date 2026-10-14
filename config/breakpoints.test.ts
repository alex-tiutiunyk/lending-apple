import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const read = (path: string) => readFileSync(join(process.cwd(), path), 'utf8')

describe('breakpoints', () => {
  it('JS and SCSS use the same rem values', () => {
    const scss = Object.fromEntries(
      Array.from(read('src/styles/_breakpoints.scss').matchAll(/(\w+): ([\d.]+)rem/g), (m) => [
        m[1],
        Number(m[2]),
      ]),
    )
    const ts = Object.fromEntries(
      Array.from(read('src/hooks/layoutWidth.ts').matchAll(/(\w+): ([\d.]+)/g), (m) => [
        m[1],
        Number(m[2]),
      ]),
    )
    expect(Object.keys(scss)).toHaveLength(4)
    expect(ts).toEqual(scss)
  })
})
