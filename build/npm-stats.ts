import { Temporal } from 'temporal-polyfill-lite'
import type { Plugin } from 'vite-plus'

/**
 * A `Temporal.Instant` in its string form. The stats travel to the page as JSON, so instants
 * are kept as strings here and revived with `Temporal.Instant.from()` where they're used.
 */
export type InstantString = string

export interface PackageStats {
  /** `latest` dist-tag on npm. */
  latest: string
  /** Publish time of `latest`. */
  released: InstantString
  /** First publish time of the package. */
  created: InstantString
  /** Downloads over the last 7 days, or null if the downloads API failed. */
  weeklyDownloads: number | null
  /** GitHub repository from the package's `repository` field, if it points to GitHub. */
  github: { slug: string; url: string } | null
}

export interface NpmStats {
  fetchedAt: InstantString
  packages: Record<string, PackageStats | null>
}

const MODULE_ID = 'virtual:npm-stats'

/**
 * Exposes npm registry data for the given packages as `virtual:npm-stats`.
 * Fetched once per dev-server start / build; a package that fails to fetch is `null`.
 */
export function npmStats(packages: string[]): Plugin {
  let stats: Promise<NpmStats> | undefined
  return {
    name: 'npm-stats',
    resolveId(id) {
      if (id === MODULE_ID) return `\0${MODULE_ID}`
    },
    async load(id) {
      if (id !== `\0${MODULE_ID}`) return
      stats ??= fetchStats(packages)
      return `export default ${JSON.stringify(await stats)}`
    },
  }
}

async function fetchStats(packages: string[]): Promise<NpmStats> {
  const entries = await Promise.all(packages.map(async (name) => [name, await fetchPackage(name)] as const))
  return { fetchedAt: Temporal.Now.instant().toString(), packages: Object.fromEntries(entries) }
}

async function fetchPackage(name: string): Promise<PackageStats | null> {
  try {
    const [registry, downloads] = await Promise.all([
      getJson(`https://registry.npmjs.org/${name.replace('/', '%2f')}`),
      getJson(`https://api.npmjs.org/downloads/point/last-week/${name}`).catch((error) => {
        console.warn(`[npm-stats] ${name} downloads: ${error}`)
        return null
      }),
    ])
    const latest: string = registry['dist-tags'].latest
    return {
      latest,
      // Parsing validates and normalizes the registry's timestamps.
      released: Temporal.Instant.from(registry.time[latest]).toString(),
      created: Temporal.Instant.from(registry.time.created).toString(),
      weeklyDownloads: downloads?.downloads ?? null,
      github: githubRepository(registry.repository),
    }
  } catch (error) {
    console.warn(`[npm-stats] ${name}: ${error}`)
    return null
  }
}

/**
 * `repository` may be a string ("github:owner/repo", "owner/repo") or `{ url }`
 * ("git+https://github.com/owner/repo.git", "git@github.com:owner/repo.git", ...).
 */
function githubRepository(repository: unknown): PackageStats['github'] {
  const raw = typeof repository === 'string' ? repository : (repository as { url?: string } | undefined)?.url
  if (!raw) return null
  const match =
    /github\.com[/:]([\w.-]+)\/([\w.-]+?)(?:\.git)?(?:[/#].*)?$/.exec(raw) ??
    /^(?:github:)?([\w.-]+)\/([\w.-]+)$/.exec(raw)
  if (!match) return null
  const slug = `${match[1]}/${match[2]}`
  return { slug, url: `https://github.com/${slug}` }
}

async function getJson(url: string) {
  const response = await fetch(url, { signal: AbortSignal.timeout(15_000) })
  if (!response.ok) throw new Error(`${response.status} ${url}`)
  return response.json()
}
