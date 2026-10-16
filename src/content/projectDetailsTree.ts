/**
 * The project details text (plan 10 §1): the README's sections between the
 * `project-details:start` / `:end` markers, turned into this tree at build time by
 * `config/projectDetails.ts` and served as `virtual:project-details/<language>`.
 */
export type DetailsInline =
  | { t: 'text'; v: string }
  | { t: 'code'; v: string }
  | { t: 'strong'; c: DetailsInline[] }
  | { t: 'link'; href: string; c: DetailsInline[] }

export type DetailsBlock =
  | { t: 'h2' | 'h3'; c: DetailsInline[] }
  | { t: 'p'; c: DetailsInline[] }
  | { t: 'ul'; items: DetailsInline[][] }
  | { t: 'table'; head: DetailsInline[][]; rows: DetailsInline[][][] }

export const detailsLanguages = ['en', 'uk'] as const

export type DetailsLanguage = (typeof detailsLanguages)[number]

export const detailsRepoUrl = 'https://github.com/alex-tiutiunyk/lending-apple'

/** The README each language comes from; also where the tab and the footer link go without JS. */
export const detailsSources: Record<DetailsLanguage, string> = {
  en: 'README.md',
  uk: 'README.uk.md',
}

/** Where the tab and the footer link go without JS (plan 10 §2). */
export const detailsReadmeUrl = `${detailsRepoUrl}/blob/main/${detailsSources.en}`
