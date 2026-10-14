export const bemNamePattern = /^[a-z][a-z0-9-]*(__[a-z0-9-]+)?(--[a-z0-9-]+)?$/

const moduleSuffix = /\.module\.s?css$/

function kebab(name: string) {
  return name
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
    .toLowerCase()
}

/** `src/components/ExplodedView/ExplodedView.module.scss` → `exploded-view` */
export function blockName(filename: string) {
  const base = filename.split(/[\\/]/).at(-1)?.split('?')[0] ?? filename
  return kebab(base.replace(moduleSuffix, ''))
}

/**
 * Scoped name for a CSS module local: `.root` → `block`, `.root--x` → `block--x`,
 * `.name` → `block__name`, `.name--x` → `block__name--x`. Keyframes from the global
 * stylesheet keep their bare name so modules can use them.
 */
export function bemScopedName(
  local: string,
  filename: string,
  globalNames: ReadonlySet<string> = new Set(),
) {
  if (globalNames.has(local)) return local
  const block = blockName(filename)
  if (local === 'root') return block
  if (local.startsWith('root--')) return `${block}${local.slice('root'.length)}`
  return `${block}__${local}`
}

export function keyframeNames(css: string) {
  return new Set(Array.from(css.matchAll(/@keyframes\s+([\w-]+)/g), (match) => match[1] ?? ''))
}
