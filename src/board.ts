import { Temporal } from 'temporal-polyfill-lite'
import { reactive } from 'vue'
import npm from 'virtual:npm-stats'
import { libraries } from './libs'
import type { DemoKey, Library } from './libs/types'

/** Load state of each library app. */
export const status = reactive({
  versions: {} as Record<string, string>,
  errors: {} as Record<string, string>,
})

export const KIND_LABELS: Record<Library['kind'], { name: string, description: string }> = {
  styled: { name: 'Styled', description: 'Ships a complete visual design' },
  headless: { name: 'Headless', description: 'Unstyled, accessible primitives — styling is up to you' },
}

/** One table per kind, in display order. */
export const groups = (['styled', 'headless'] as const)
  .map((kind) => ({ kind, libraries: libraries.filter((lib) => lib.kind === kind) }))
  .filter((group) => group.libraries.length > 0)

export const DEMO_LABELS: Record<DemoKey, string> = {
  button: 'Button',
  input: 'Input',
  select: 'Select',
  switch: 'Switch',
  dialog: 'Dialog',
}

/** npm timestamps as calendar dates in UTC, so "N days ago" reads the same for every viewer. */
const toDate = (instant: string) => Temporal.Instant.from(instant).toZonedDateTimeISO('UTC').toPlainDate()

const fetchedOn = toDate(npm.fetchedAt)

export const npmFetchedAt = fetchedOn.toString()

// ---- npm stats ----------------------------------------------------------------

export interface Release {
  ago: string
  latest: string
  date: string
  stale: boolean
}

export interface Downloads {
  label: string
  /** 0–1 on a log scale relative to the most downloaded library. */
  ratio: number
}

const relativeDay = new Intl.RelativeTimeFormat('en', { numeric: 'auto' }) // "today", "yesterday"
const relative = new Intl.RelativeTimeFormat('en') // "1 month ago", not "last month"
const compact = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 })
const maxDownloads = Math.max(1, ...libraries.map((lib) => npm.packages[lib.package]?.weeklyDownloads ?? 0))

export function release(lib: Library): Release | null {
  const stats = npm.packages[lib.package]
  if (!stats) return null
  const releasedOn = toDate(stats.released)
  return {
    latest: stats.latest,
    date: releasedOn.toString(),
    ago: ago(releasedOn),
    // No release within a year of when the stats were fetched.
    stale: Temporal.PlainDate.compare(releasedOn.add({ years: 1 }), fetchedOn) < 0,
  }
}

/** Days up to a month, months up to two years, then years — counted on the calendar. */
function ago(date: Temporal.PlainDate) {
  const { days } = date.until(fetchedOn, { largestUnit: 'days' })
  if (days < 31) return relativeDay.format(-days, 'day')
  const { years, months } = date.until(fetchedOn, { largestUnit: 'years' })
  if (years < 2) return relative.format(-(years * 12 + months), 'month')
  return relative.format(-years, 'year')
}

export function downloads(lib: Library): Downloads | null {
  const count = npm.packages[lib.package]?.weeklyDownloads
  if (count == null) return null
  // Log scale, so an 800/week library is still visible next to a 1M/week one.
  // Intl writes thousands as "K"; the SI prefix for kilo is lowercase "k" (M stays uppercase).
  const label = compact.format(count).replace(/K$/, 'k')
  return { label, ratio: Math.log10(count + 1) / Math.log10(maxDownloads + 1) }
}

export function github(lib: Library) {
  if (lib.repository) return { slug: lib.repository, url: `https://github.com/${lib.repository}` }
  return npm.packages[lib.package]?.github ?? null
}
