import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { detailsRepoUrl, type DetailsBlock } from '../src/content/projectDetailsTree'
import { cutDetails, parseDetails, parseInline, resolveHref } from './projectDetails'

const readme = (name: string) =>
  parseDetails(cutDetails(readFileSync(join(process.cwd(), name), 'utf8')))

/** The structure without the words: what both languages must share (plan 10 §1). */
function shape(blocks: DetailsBlock[]) {
  return blocks.map((block) => {
    if (block.t === 'ul') return `ul:${block.items.length}`
    if (block.t === 'table') return `table:${block.head.length}x${block.rows.length}`
    return block.t
  })
}

describe('project details converter', () => {
  it('reads headings, paragraphs, lists and tables', () => {
    const blocks = parseDetails(
      [
        '## Stack',
        '',
        '| Area | Tools |',
        '| ---- | ----- |',
        '| **UI** | React |',
        '',
        'One `react` line',
        'and its continuation.',
        '',
        '### Motion',
        '',
        '- **One loop.** It sleeps',
        '  when nothing moves.',
        '- Two',
      ].join('\n'),
    )
    expect(shape(blocks)).toEqual(['h2', 'table:2x1', 'p', 'h3', 'ul:2'])
    expect(blocks[2]).toEqual({
      t: 'p',
      c: [
        { t: 'text', v: 'One ' },
        { t: 'code', v: 'react' },
        { t: 'text', v: ' line and its continuation.' },
      ],
    })
    const list = blocks[4]
    expect(list?.t === 'ul' && list.items[0]).toEqual([
      { t: 'strong', c: [{ t: 'text', v: 'One loop.' }] },
      { t: 'text', v: ' It sleeps when nothing moves.' },
    ])
  })

  it('drops images and raw HTML, keeps links', () => {
    const blocks = parseDetails(
      '<img src="a.gif" />\n\n![badge](https://example.com/b.svg) See [the docs](docs/README.md).',
    )
    expect(blocks).toEqual([
      {
        t: 'p',
        c: [
          { t: 'text', v: ' See ' },
          {
            t: 'link',
            href: `${detailsRepoUrl}/blob/main/docs/README.md`,
            c: [{ t: 'text', v: 'the docs' }],
          },
          { t: 'text', v: '.' },
        ],
      },
    ])
  })

  it('points repo-relative links at GitHub', () => {
    expect(resolveHref('docs/')).toBe(`${detailsRepoUrl}/tree/main/docs/`)
    expect(resolveHref('https://example.com/')).toBe('https://example.com/')
    expect(() => resolveHref('#top')).toThrow()
  })

  it.each([
    ['a blockquote', '> quoted'],
    ['a deep heading', '#### Deep'],
    ['an ordered list', '1. first'],
    ['a code fence', '```sh'],
    ['a nested list', '- one\n  - two'],
    ['emphasis', 'some *emphasis* here'],
    ['inline HTML', 'a <kbd>key</kbd>'],
  ])('fails on %s', (_name, markdown) => {
    expect(() => parseDetails(markdown)).toThrow(/project details/)
  })

  it('fails without the markers', () => {
    expect(() => cutDetails('## Stack')).toThrow(/markers/)
  })

  it('keeps nested strong and code in links', () => {
    expect(parseInline('[`a`](https://x.dev/)')).toEqual([
      { t: 'link', href: 'https://x.dev/', c: [{ t: 'code', v: 'a' }] },
    ])
  })
})

describe('the READMEs', () => {
  const english = readme('README.md')
  const ukrainian = readme('README.uk.md')

  it('give the dialog the tech stack and what was built', () => {
    expect(shape(english)).toEqual(['h2', 'table:2x7', 'p', 'h2', 'h3', 'ul:8', 'h3', 'ul:3'])
  })

  it('have the same structure in both languages', () => {
    expect(shape(ukrainian)).toEqual(shape(english))
  })

  it('carry no images', () => {
    const json = JSON.stringify([english, ukrainian])
    expect(json).not.toMatch(/<img|<picture|<svg|\.gif|\.png|shields\.io/)
  })
})
