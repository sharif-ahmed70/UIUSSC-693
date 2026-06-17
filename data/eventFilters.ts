export const eventFilters = [
  'All Events',
  'Blood Donation',
  'Donation Drive',
  'Campaign',
  'Orientation'
] as const

export type EventFilter = typeof eventFilters[number]
