const matchesByQuery = new Map<string, boolean>()
const listsByQuery = new Map<string, FakeMediaQueryList>()

class FakeMediaQueryList extends EventTarget implements MediaQueryList {
  onchange = null

  constructor(readonly media: string) {
    super()
  }

  get matches() {
    return matchesByQuery.get(this.media) ?? false
  }

  addListener() {}

  removeListener() {}
}

export function fakeMatchMedia(query: string) {
  const list = listsByQuery.get(query) ?? new FakeMediaQueryList(query)
  listsByQuery.set(query, list)
  return list
}

export function setMediaQuery(query: string, matches: boolean) {
  matchesByQuery.set(query, matches)
  listsByQuery.get(query)?.dispatchEvent(new Event('change'))
}

export function resetMediaQueries() {
  matchesByQuery.clear()
  listsByQuery.clear()
}
