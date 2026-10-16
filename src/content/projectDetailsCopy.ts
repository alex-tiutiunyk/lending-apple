// The project details dialog (plan 10 §4): its strings switch with its text, while the page
// around it stays English. Imported only by the dialog, so they load with its chunk.
export const detailsDialogCopy = {
  en: {
    title: 'About this project',
    languages: 'Language',
    close: 'Close',
    loading: 'Loading…',
    switched: 'English',
  },
  uk: {
    title: 'Про проєкт',
    languages: 'Мова',
    close: 'Закрити',
    loading: 'Завантаження…',
    switched: 'Українська',
  },
} as const

export const detailsLanguageNames = { en: 'EN', uk: 'УКР' } as const
