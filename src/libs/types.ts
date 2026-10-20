import type { DeepReadonly } from "vue";
import type { Controls } from "../store";

export const DEMOS = ["button", "input", "select", "switch", "dialog"] as const;
export type DemoKey = (typeof DEMOS)[number];

/**
 * How a library reaches your project, in tab order:
 * `styled` installs a visual design as a package; `copy-paste` copies styled component source
 * into your project with a CLI (shadcn-vue style), so you own the code; `headless` installs
 * unstyled, accessible primitives and leaves the styling to you; `fancy` is copied in like
 * copy-paste but is animated, effect-first components (most rows have no counterpart).
 */
export const KINDS = ["styled", "copy-paste", "headless", "fancy"] as const;
export type Kind = (typeof KINDS)[number];

/** What the shell hands a library: where to render, and the options to render with. */
export interface MountContext {
  /** One cell per demo row; the library's demos are teleported into them (see DemoCells.vue). */
  cells: Record<DemoKey, HTMLElement>;
  /** Where the library should render dialogs and popups, inside its CSS scope. */
  overlay: HTMLElement;
  /** The shell's demo options: libraries read them, only the shell changes them. */
  controls: DeepReadonly<Controls>;
}

/** The library's own component behind one demo row, as its docs name it. */
export interface ComponentRef {
  /** e.g. `VTextField`, `QToggle`; for a plain element, how it's built (`native <button>`). */
  name: string;
  /** The component's docs page; absent when there is none (e.g. a native element). */
  docs?: string;
}

/** Static info about a library. Must not import the library itself (read by vite.config). */
export interface LibraryMeta {
  /** Directory name under src/libs and value of `data-lib`. */
  id: string;
  name: string;
  /** npm package linked from the column header and used for npm stats; absent when it isn't on npm. */
  package?: string;
  /** Which tab the library is in; see KINDS. */
  kind: Kind;
  /** Path fragments of CSS files to scope under `[data-lib="<id>"]`. */
  cssMatch: string[];
  /** Attributes set on the library's scope elements while dark mode is on. */
  darkAttrs?: Record<string, string>;
  /** Attributes set while dark mode is off, for libraries that otherwise follow the OS setting. */
  lightAttrs?: Record<string, string>;
  /** GitHub `owner/repo`, when the package's npm `repository` field is missing or outdated. */
  repository?: string;
  /** What each demo row shows in this library; rows it has no component for are left out. */
  components?: Partial<Record<DemoKey, ComponentRef>>;
  /** Why the library has no demos; it's then listed with npm stats only (and has no index.ts). */
  withoutDemos?: string;
}

export interface LibraryModule {
  version: string;
  mount: (context: MountContext) => () => void;
}

export interface Library extends LibraryMeta {
  /** Null for a stats-only library (`withoutDemos`). */
  load: (() => Promise<LibraryModule>) | null;
}
