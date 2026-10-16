import { join } from 'node:path'
import { compileString } from 'sass'
import { describe, expect, it } from 'vitest'

const stylesDirectory = join(process.cwd(), 'src/styles')

function compile(scss: string) {
  return compileString(`@use 'mixins';\n${scss}`, { loadPaths: [stylesDirectory] }).css.replace(
    /\s+/g,
    ' ',
  )
}

describe('motion mixins', () => {
  it('motion-safe needs a level other than off, and the OS setting where no script ran', () => {
    const css = compile('.a { @include mixins.motion-safe { color: red; } }')
    expect(css).toContain('@media (prefers-reduced-motion: no-preference), (scripting: enabled)')
    expect(css).toContain(':where(:root:not([data-motion=off])) .a')
  })

  it('motion-reduce applies at the off level, or under the OS setting where no script ran', () => {
    const css = compile('.a { @include mixins.motion-reduce { color: red; } }')
    expect(css).toContain(
      '@media (prefers-reduced-motion: reduce) { :where(:root:not([data-motion])) .a {',
    )
    expect(css).toContain(':where(:root[data-motion=off]) .a {')
  })

  it('works at the top level of a module', () => {
    const css = compile(
      '@include mixins.motion-safe { .b { color: red; } } @include mixins.motion-reduce { .c { color: red; } }',
    )
    expect(css).toContain(':where(:root:not([data-motion=off])) .b')
    expect(css).toContain(':where(:root[data-motion=off]) .c')
  })

  it('ambient motion and awake sections stop at calm and off', () => {
    const css = compile(
      '.a { @include mixins.when-awake { color: red; } } .b { @include mixins.motion-ambient { color: red; } }',
    )
    expect(css).toContain(':where(:root:not([data-motion=calm], [data-motion=off])) .a[data-awake]')
    expect(css).toContain(':where(:root:not([data-motion=calm], [data-motion=off])) .b')
  })

  it('root variants put the level on the root element itself', () => {
    const css = compile(
      'html { @include mixins.root-motion-safe { scroll-behavior: smooth; } @include mixins.root-motion-reduce { transition: none; } }',
    )
    expect(css).toContain('html:not([data-motion=off])')
    expect(css).toContain('html[data-motion=off]')
  })
})
