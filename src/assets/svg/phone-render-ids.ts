export type RenderIds = ReturnType<typeof renderIds>

/** The gradient ids of one render, unique per instance through `useId`. */
export function renderIds(id: string) {
  return {
    shell: `${id}-shell`,
    screen: `${id}-screen`,
    glare: `${id}-glare`,
    lens: `${id}-lens`,
  }
}
