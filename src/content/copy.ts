export const product = {
  name: 'Concept 18 Pro',
} as const

export const navigation = [
  { href: '#design', label: 'Design' },
  { href: '#inside', label: 'Inside' },
  { href: '#numbers', label: 'Numbers' },
  { href: '#finishes', label: 'Finishes' },
] as const

export const headerCopy = {
  homeLabel: 'Concept 18 Pro, back to top',
  navLabel: 'Sections',
  reserve: 'Reserve',
  skipLink: 'Skip to content',
} as const

export const heroCopy = {
  eyebrow: 'Unofficial design study',
  title: 'The phone, drawn again from a single line.',
  lede: 'A concept for the next iPhone: a 2 nm chip, a 120 mm periscope that fits in 8.2 mm of titanium, and a battery that lasts a long-haul flight plus the taxi after it.',
  primaryCta: 'Reserve yours',
  secondaryCta: 'See how it is built',
} as const

export const lineDrawCopy = {
  title: 'It starts as one stroke',
  body: 'Every corner on the band shares one radius family, so the outline reads as a single gesture. Keep scrolling: the island and the camera come last.',
  renderLabel: 'Front and back of the phone in the selected finish',
} as const

export const explodedCopy = {
  title: 'What it is made of',
  intro:
    'Seven layers in 8.2 mm. Scroll and they settle into one phone; scroll back and it comes apart again.',
  listLabel: 'Layers, from back to front',
} as const

export const numbersCopy = {
  title: 'The numbers',
  ctaText: 'Pre-orders open November 20.',
  cta: 'Reserve yours',
} as const

export const featuresCopy = {
  title: 'Four decisions behind it',
  camera: {
    title: 'A periscope that fits the band',
    body: 'The 5× telephoto folds light twice, so a 120 mm equivalent lens lives inside an 8.2 mm body. All three sensors share one 48 MP class, which keeps colour steady while you zoom.',
    lensesLabel: 'Rear lenses, as 35 mm equivalents',
  },
  display: {
    title: 'Brighter outside, dimmer in bed',
    body: 'It peaks at 3,000 nits in direct sun and drops to one nit at night.',
  },
  chip: {
    title: 'The N2 chip',
    body: 'Built on a 2 nm process and tuned for long sustained loads rather than short benchmark bursts.',
    tableCaption: 'Core counts',
    unitHeader: 'Unit',
    coresHeader: 'Cores',
  },
  titanium: {
    title: 'A band of grade 5 titanium',
    body: 'It weighs 19 g less than steel and wears scratches as patina, not damage.',
    renderLabel: 'Brushed titanium band sample in the selected finish',
  },
} as const

export const finishesCopy = {
  title: 'Pick a finish',
  body: 'The colour runs through the glass rather than sitting on top of it. Choose one and the whole page follows.',
  legend: 'Finish',
  renderLabel: 'Back of the phone in',
} as const

export const reserveCopy = {
  title: 'Reserve yours',
  bodyBefore: 'Pre-orders open on',
  bodyAfter: 'Leave an email and we will remind you an hour before.',
  countdownLabel: 'Time until pre-orders open',
  countdownUnits: { days: 'days', hours: 'hours', minutes: 'minutes' },
  countdownDone: 'Pre-orders are open.',
  emailLabel: 'Email address',
  submit: 'Reserve',
  submitting: 'Reserving…',
  privacyNote: 'This is a concept page. Your email is not sent or stored anywhere.',
  invalidEmail: 'That does not look like an email address. Check for a missing @ or dot.',
  missingEmail: 'Enter your email address to reserve.',
  successTitle: 'You are on the list.',
  successBody:
    'Nothing was actually sent: this is a portfolio concept. Thanks for trying the form.',
  renderLabel: 'Front of the phone in the selected finish',
} as const

export const stickyCtaCopy = {
  label: 'Quick reserve',
  text: 'Pre-orders open Nov 20',
  cta: 'Reserve',
} as const

export const footerCopy = {
  legal:
    'Concept 18 Pro is an unofficial design study made for a portfolio. It is not affiliated with, endorsed by or connected to Apple Inc. iPhone is a trademark of Apple Inc., registered in the U.S. and other countries. Every specification on this page is invented.',
  fontCredit: 'Set in Bricolage Grotesque, SIL Open Font License.',
  linksLabel: 'Footer',
  links: [
    { href: '#top', label: 'Back to top' },
    { href: '#reserve', label: 'Reserve' },
    { href: '/fonts/OFL.txt', label: 'Font license' },
  ],
} as const
