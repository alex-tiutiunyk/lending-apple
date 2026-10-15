/** The person-in-circle glyph (the plan 3 handle), with the limbs split so they can move. */
export const glyph = {
  viewBox: '0 0 24 24',
  ring: { cx: 12, cy: 12, r: 10.5 },
  head: { cx: 12, cy: 6.6, r: 1.6 },
  torso: 'M12 10.6 V14',
  armLeft: 'M12 10.6 L6.5 9.6',
  armRight: 'M12 10.6 L17.5 9.6',
  legLeft: 'M12 14 L9.4 18.6',
  legRight: 'M12 14 L14.6 18.6',
} as const
