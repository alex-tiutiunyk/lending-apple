export const launch = {
  opensAtUtc: '2026-11-20T17:00:00Z',
  opensAtLabel: 'Friday, November 20, at 17:00 UTC',
} as const

export const stats = [
  { id: 'process', value: 2, unit: 'nm', label: 'chip process node', footnote: 1 },
  { id: 'camera', value: 48, unit: 'MP', label: 'on each of the three rear cameras', footnote: 1 },
  { id: 'battery', value: 31, unit: 'h', label: 'of video playback on one charge', footnote: 2 },
  {
    id: 'brightness',
    value: 3000,
    unit: 'nits',
    label: 'peak brightness in direct sun',
    footnote: 1,
  },
  { id: 'weight', value: 187, unit: 'g', label: 'with the titanium band', footnote: 1 },
] as const

export const statFootnotes = [
  'Concept targets for this design study. Nothing here was manufactured or measured.',
  'Estimated for local video at 50 % brightness with wireless radios off.',
] as const

export const layers = [
  {
    id: 'back-glass',
    name: 'Back glass',
    detail: 'Matte glass, color-fused before tempering so it cannot wear off.',
    inCompactView: true,
  },
  {
    id: 'frame',
    name: 'Titanium band',
    detail: 'Grade 5 titanium around an aluminum core that spreads heat.',
    inCompactView: false,
  },
  {
    id: 'battery',
    name: 'Battery',
    detail: '4,685 mAh stacked cell, 12 % denser than a wound one.',
    inCompactView: true,
  },
  {
    id: 'logic-board',
    name: 'Logic board',
    detail: 'Two boards sandwiched around the N2 chip to free room for the cell.',
    inCompactView: false,
  },
  {
    id: 'camera',
    name: 'Camera module',
    detail: 'Three 48 MP sensors: 13 mm, 24 mm and a 120 mm folded periscope.',
    inCompactView: true,
  },
  {
    id: 'display',
    name: 'Display',
    detail: '6.3-inch LTPO OLED that idles at 1 Hz and peaks at 120 Hz.',
    inCompactView: true,
  },
  {
    id: 'front-glass',
    name: 'Front glass',
    detail: 'Ceramic-reinforced cover with an anti-reflective coating.',
    inCompactView: true,
  },
] as const

export type LayerId = (typeof layers)[number]['id']

export const finishes = [
  {
    id: 'tidewater',
    name: 'Tidewater',
    note: 'Cold blue-green, like a harbor at 7 am.',
    hue: 192,
    saturation: 62,
    lightness: 58,
  },
  {
    id: 'ember',
    name: 'Ember',
    note: 'Burnt orange that darkens toward the edges.',
    hue: 18,
    saturation: 78,
    lightness: 64,
  },
  {
    id: 'moss',
    name: 'Moss',
    note: 'A dry, gray-leaning green.',
    hue: 96,
    saturation: 30,
    lightness: 62,
  },
  {
    id: 'basalt',
    name: 'Basalt',
    note: 'Almost black, with a cool undertone.',
    hue: 216,
    saturation: 12,
    lightness: 72,
  },
] as const

export type Finish = (typeof finishes)[number]
export type FinishId = Finish['id']

export const lenses = [
  { focalLength: '13 mm', role: 'Ultra wide' },
  { focalLength: '24 mm', role: 'Main' },
  { focalLength: '120 mm', role: 'Periscope, 5×' },
] as const

export const chipCores = [
  { unit: 'CPU', cores: 6 },
  { unit: 'GPU', cores: 6 },
  { unit: 'Neural engine', cores: 16 },
] as const
