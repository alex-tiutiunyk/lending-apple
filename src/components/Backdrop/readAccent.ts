/** The page accent as `h s l`, from the inline finish on `<html>` or the stylesheet default. */
export function readAccent() {
  const root = document.documentElement
  const computed = getComputedStyle(root)
  const read = (name: string) =>
    root.style.getPropertyValue(name) || computed.getPropertyValue(name)
  return `${read('--accent-h')} ${read('--accent-s')} ${read('--accent-l')}`
}
