import { Temporal } from "temporal-polyfill-lite";
import installed from "virtual:installed-versions";
import npm from "virtual:npm-stats";
import { libraries } from "./libs";
import { type DemoKey, type Kind, KINDS, type Library } from "./libs/types";

export const KIND_LABELS: Record<Kind, { name: string; description: string }> = {
  "styled": { name: "Styled", description: "Ships a complete visual design" },
  "copy-paste": {
    name: "Copy-paste",
    description: "Styled components a CLI copies into your project — you own the code",
  },
  "fancy": { name: "Fancy", description: "Animated, effect-first components a CLI copies into your project" },
  "headless": { name: "Headless", description: "Unstyled, accessible primitives — styling is up to you" },
};

export const DEMO_LABELS: Record<DemoKey, string> = {
  button: "Button",
  input: "Input",
  select: "Select",
  switch: "Switch",
  dialog: "Dialog",
};

/** npm timestamps as calendar dates in UTC, so "N days ago" reads the same for every viewer. */
const toDate = (instant: string) => Temporal.Instant.from(instant).toZonedDateTimeISO("UTC").toPlainDate();

/** The day the npm stats were fetched; null when no package could be. */
const fetchedOn = npm.fetchedAt ? toDate(npm.fetchedAt) : null;

/** `YYYY-MM-DD`, or null when there are no npm stats at all. */
export const npmFetchedAt = fetchedOn?.toString() ?? null;

// ---- npm stats ----------------------------------------------------------------

export interface Release {
  ago: string;
  latest: string;
  date: string;
  stale: boolean;
}

/** npm stats for the library's package; null when it has none or the fetch failed. */
const statsOf = (lib: Library) => (lib.package ? (npm.packages[lib.package] ?? null) : null);

const relativeDay = new Intl.RelativeTimeFormat("en", { numeric: "auto" }); // "today", "yesterday"
const relative = new Intl.RelativeTimeFormat("en"); // "1 month ago", not "last month"
const compact = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });

function release(lib: Library): Release | null {
  const stats = statsOf(lib);
  // Any package's stats imply a fetch went through, which sets fetchedOn.
  if (!stats || !fetchedOn) return null;
  const releasedOn = toDate(stats.released);
  return {
    latest: stats.latest,
    date: releasedOn.toString(),
    ago: ago(releasedOn, fetchedOn),
    stale: isStale(releasedOn, fetchedOn),
  };
}

/** No release within a year of `today`. */
export function isStale(released: Temporal.PlainDate, today: Temporal.PlainDate) {
  return Temporal.PlainDate.compare(released.add({ years: 1 }), today) < 0;
}

/** Days up to a month, months up to two years, then years — counted on the calendar. */
export function ago(date: Temporal.PlainDate, today: Temporal.PlainDate) {
  const { days } = date.until(today, { largestUnit: "days" });
  if (days < 31) return relativeDay.format(-days, "day");
  const { years, months } = date.until(today, { largestUnit: "years" });
  if (years < 2) return relative.format(-(years * 12 + months), "month");
  return relative.format(-years, "year");
}

/** A download count as the header shows it: "1.2M", "830k", "950". */
export function formatDownloads(count: number) {
  // Intl writes thousands as "K"; the SI prefix for kilo is lowercase "k" (M stays uppercase).
  return compact.format(count).replace(/K$/, "k");
}

function downloads(lib: Library) {
  const count = statsOf(lib)?.weeklyDownloads;
  return count == null ? null : formatDownloads(count);
}

function github(lib: Library) {
  if (lib.repository) return { slug: lib.repository, url: `https://github.com/${lib.repository}` };
  return statsOf(lib)?.github ?? null;
}

/**
 * The version shown: the installed one, or npm's latest for a library that isn't installed
 * (stats-only); copied-in components without a package have none to show.
 */
function version(lib: Library) {
  if (!lib.package) return "not on npm";
  return installed[lib.package] ?? statsOf(lib)?.latest ?? null;
}

// ---- table --------------------------------------------------------------------

/** A library as its table column shows it: the npm data is static, so it's derived once here. */
export interface Column extends Library {
  version: string | null;
  release: Release | null;
  /** Weekly npm downloads, formatted; null when unknown. */
  downloads: string | null;
  github: { slug: string; url: string } | null;
}

/**
 * The columns in a saved order: the ids it lists first, as listed (unknown ones skipped), then any
 * column it doesn't list, in default order, so a library added later still shows.
 */
export function orderColumns<T extends { id: string }>(columns: readonly T[], order: readonly string[] = []): T[] {
  const rank = (id: string) => {
    const index = order.indexOf(id);
    return index === -1 ? order.length : index;
  };
  return [...columns].sort((a, b) => rank(a.id) - rank(b.id));
}

/** One table per kind, in display order. */
export const groups = KINDS.map((kind) => ({
  kind,
  columns: libraries
    .filter((lib) => lib.kind === kind)
    .map((lib): Column => ({
      ...lib,
      version: version(lib),
      release: release(lib),
      downloads: downloads(lib),
      github: github(lib),
    })),
})).filter((group) => group.columns.length > 0);
