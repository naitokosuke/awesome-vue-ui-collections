export const DEMOS = ['button', 'input', 'select', 'switch', 'dialog'] as const
export type DemoKey = (typeof DEMOS)[number]

export interface MountTargets {
  /** One cell per demo row; the library teleports each demo into its cell. */
  cells: Record<DemoKey, HTMLElement>
  /** Where the library should render dialogs and popups, inside its CSS scope. */
  overlay: HTMLElement
}

/** Static info about a library. Must not import the library itself (read by vite.config). */
export interface LibraryMeta {
  /** Directory name under src/libs and value of `data-lib`. */
  id: string
  name: string
  /** npm package shown in the column header and used for npm stats. */
  package: string
  /** `headless`: unstyled primitives (styling is up to you); `styled`: ships a visual design. */
  kind: 'styled' | 'headless'
  /** Path fragments of CSS files to scope under `[data-lib="<id>"]`. */
  cssMatch: string[]
  /** Attributes set on the library's scope elements while dark mode is on. */
  darkAttrs?: Record<string, string>
  /** GitHub `owner/repo`, when the package's npm `repository` field is missing or outdated. */
  repository?: string
  /** Why the library has no demos; it's then listed with npm stats only (and has no index.ts). */
  withoutDemos?: string
}

export interface LibraryModule {
  version: string
  mount: (targets: MountTargets) => () => void
}

export interface Library extends LibraryMeta {
  /** Null for a stats-only library (`withoutDemos`). */
  load: (() => Promise<LibraryModule>) | null
}
