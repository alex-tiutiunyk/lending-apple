import { readFileSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'
import type { Plugin } from 'vite'
import {
  detailsLanguages,
  detailsRepoUrl,
  detailsSources,
  type DetailsBlock,
  type DetailsInline,
} from '../src/content/projectDetailsTree'

// Plan 10 §1: the README is the source of the project details dialog. Only the Markdown the
// README uses is understood; anything else fails the build, so an edit cannot render wrong.

const startMarker = '<!-- project-details:start -->'
const endMarker = '<!-- project-details:end -->'
const virtualPrefix = 'virtual:project-details/'

/** The text between the markers. */
export function cutDetails(markdown: string) {
  const start = markdown.indexOf(startMarker)
  const end = markdown.indexOf(endMarker)
  if (start < 0 || end < start) throw new Error('project details: markers missing or out of order')
  return markdown.slice(start + startMarker.length, end)
}

/** Repo-relative links point at GitHub: the page does not serve the repo's files. */
export function resolveHref(href: string) {
  if (/^https?:\/\//.test(href)) return href
  if (/^[#/]|^\.\.|^[a-z]+:/i.test(href))
    throw new Error(`project details: unsupported link ${href}`)
  const path = href.replace(/^\.\//, '')
  return `${detailsRepoUrl}/${path.endsWith('/') ? 'tree' : 'blob'}/main/${path}`
}

const inlinePattern = /!\[[^\]]*\]\([^)]*\)|`([^`]+)`|\*\*(.+?)\*\*|\[([^\]]+)\]\(([^)\s]+)\)/g

export function parseInline(source: string): DetailsInline[] {
  const nodes: DetailsInline[] = []
  const pushText = (text: string) => {
    if (!text) return
    if (/[*_]{2}|(^|\s)\*\S|<[a-z/]/i.test(text)) {
      throw new Error(`project details: unsupported inline syntax in "${text}"`)
    }
    nodes.push({ t: 'text', v: text })
  }
  let last = 0
  for (const match of source.matchAll(inlinePattern)) {
    pushText(source.slice(last, match.index))
    last = match.index + match[0].length
    const [whole, code, strong, label, href] = match
    if (whole.startsWith('!')) continue // images stay on GitHub
    if (code !== undefined) nodes.push({ t: 'code', v: code })
    else if (strong !== undefined) nodes.push({ t: 'strong', c: parseInline(strong) })
    else if (label !== undefined && href !== undefined) {
      nodes.push({ t: 'link', href: resolveHref(href), c: parseInline(label) })
    }
  }
  pushText(source.slice(last))
  return nodes
}

const tableCells = (line: string) =>
  line
    .trim()
    .replace(/^\||\|$/g, '')
    .split('|')
    .map((cell) => parseInline(cell.trim()))

export function parseDetails(markdown: string): DetailsBlock[] {
  const lines = markdown.replace(/\r\n?/g, '\n').split('\n')
  const blocks: DetailsBlock[] = []
  let index = 0
  const next = () => lines[index] ?? ''

  while (index < lines.length) {
    const line = next()
    if (!line.trim() || /^<img\b|^<\/?(div|sub|p)\b/.test(line.trim())) {
      index += 1
    } else if (/^#{2,3} /.test(line)) {
      blocks.push({
        t: line.startsWith('###') ? 'h3' : 'h2',
        c: parseInline(line.replace(/^#+ /, '')),
      })
      index += 1
    } else if (line.startsWith('|')) {
      const head = tableCells(line)
      if (!/^\|[\s|:-]+\|$/.test(lines[index + 1]?.trim() ?? '')) {
        throw new Error('project details: a table needs a separator row')
      }
      index += 2
      const rows: DetailsInline[][][] = []
      while (next().startsWith('|')) {
        rows.push(tableCells(next()))
        index += 1
      }
      blocks.push({ t: 'table', head, rows })
    } else if (line.startsWith('- ')) {
      const items: string[] = []
      while (next().startsWith('- ') || /^ {2}\S/.test(next())) {
        if (next().startsWith('- ')) items.push(next().slice(2))
        else if (/^ {2}[-*] /.test(next())) throw new Error('project details: nested lists')
        else items[items.length - 1] += ` ${next().trim()}`
        index += 1
      }
      blocks.push({ t: 'ul', items: items.map((item) => parseInline(item.trim())) })
    } else if (/^(#|>|```|\d+\.|\* |\s)/.test(line)) {
      throw new Error(`project details: unsupported block "${line}"`)
    } else {
      const text: string[] = []
      while (next().trim() && !/^(#|\||- |>|```|<)/.test(next())) {
        text.push(next().trim())
        index += 1
      }
      blocks.push({ t: 'p', c: parseInline(text.join(' ')) })
    }
  }
  return blocks
}

const rootFile = (name: string) => fileURLToPath(new URL(`../${name}`, import.meta.url))

/** `virtual:project-details/en` and `/uk`: each language its own chunk, fetched when shown. */
export function projectDetails(): Plugin {
  return {
    name: 'project-details',
    resolveId(id) {
      return id.startsWith(virtualPrefix) ? `\0${id}` : undefined
    },
    load(id) {
      if (!id.startsWith(`\0${virtualPrefix}`)) return undefined
      const language = id.slice(virtualPrefix.length + 1)
      if (!detailsLanguages.some((known) => known === language)) {
        throw new Error(`project details: no language ${language}`)
      }
      const file = rootFile(detailsSources[language as keyof typeof detailsSources])
      this.addWatchFile(file)
      const blocks = parseDetails(cutDetails(readFileSync(file, 'utf8')))
      return `export default ${JSON.stringify(blocks)}`
    },
  }
}
