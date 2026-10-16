import { useEffect, useState } from 'react'
import type { DetailsBlock, DetailsLanguage } from '@/content/projectDetailsTree'

// Each language is its own chunk (plan 10 §1), fetched when it is shown or about to be
const loaders: Record<DetailsLanguage, () => Promise<{ default: DetailsBlock[] }>> = {
  en: () => import('virtual:project-details/en'),
  uk: () => import('virtual:project-details/uk'),
}

const loaded = new Map<DetailsLanguage, DetailsBlock[]>()
// The request in flight, so a hover and the press after it fetch the chunk once
const pending = new Map<DetailsLanguage, Promise<DetailsBlock[]>>()

function load(language: DetailsLanguage) {
  const request =
    pending.get(language) ??
    loaders[language]().then(
      (module) => {
        loaded.set(language, module.default)
        return module.default
      },
      (error: unknown) => {
        pending.delete(language)
        throw error
      },
    )
  pending.set(language, request)
  return request
}

/** A hover or focus on the language switch fetches that language early. */
export function prefetchDetailsText(language: DetailsLanguage) {
  if (!loaded.has(language)) load(language).catch(() => undefined)
}

type TextState = { language: DetailsLanguage; blocks: DetailsBlock[] | 'failed' }

/** The text of one language; null while its chunk loads, 'failed' when it could not. */
export function useDetailsText(language: DetailsLanguage) {
  const [state, setState] = useState<TextState | null>(null)

  useEffect(() => {
    if (loaded.has(language)) return
    let isLive = true
    load(language).then(
      (blocks) => isLive && setState({ language, blocks }),
      () => isLive && setState({ language, blocks: 'failed' }),
    )
    return () => {
      isLive = false
    }
  }, [language])

  return loaded.get(language) ?? (state?.language === language ? state.blocks : null)
}
