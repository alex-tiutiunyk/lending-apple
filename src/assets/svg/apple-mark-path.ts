export const appleMarkViewBox = '0 0 24 24'

/** The whole apple, symmetric about x = 12; the tests and the bite geometry measure against it. */
export const appleWholeBodyPath =
  'M12 7.2 C10.4 6 8 5.9 6.5 7.1 C4.6 8.6 4.2 11.6 5.1 14.4 C6 17.3 8 20.2 10 20.2 C10.9 20.2 11.3 19.7 12 19.7 C12.7 19.7 13.1 20.2 14 20.2 C16 20.2 18 17.3 18.9 14.4 C19.8 11.6 19.4 8.6 17.5 7.1 C16 5.9 13.6 6 12 7.2 Z'

/**
 * The mark at rest (plan 9 §1): the whole apple with the round bite on the right, the last
 * circle of the chomp table (r 4.2 at (21.6, 10.4)). The right-hand curve is split where it meets
 * the circle (t 0.076 and 0.851, de Casteljau) and the arc replaces the part between. A literal,
 * because `npm run points` reads it from this file; the unit test ties it to the chomp table.
 */
export const appleBodyPath =
  'M12 7.2 C10.4 6 8 5.9 6.5 7.1 C4.6 8.6 4.2 11.6 5.1 14.4 C6 17.3 8 20.2 10 20.2 C10.9 20.2 11.3 19.7 12 19.7 C12.7 19.7 13.1 20.2 14 20.2 C16 20.2 18 17.3 18.9 14.4 C18.97 14.19 19.03 13.97 19.08 13.76 A4.2 4.2 0 0 1 18.25 7.87 C18.03 7.58 17.78 7.32 17.5 7.1 C16 5.9 13.6 6 12 7.2 Z'

export const appleLeafPath = 'M12.5 6.1 C12.3 4.2 13.6 2.7 15.7 2.5 C15.8 4.4 14.5 5.9 12.5 6.1 Z'
