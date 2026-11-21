import type { DeepReadonly } from "vue";

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

export const SIZES = ["small", "medium", "large"] as const;

export type Size = (typeof SIZES)[number];

/** Primary colors the styled libraries can be switched to (hex, so every library API accepts them). */
export const COLORS = {
  black: "#18181b",
  blue: "#2563eb",
  violet: "#7c3aed",
  green: "#16a34a",
  orange: "#ea580c",
  rose: "#e11d48",
} as const;

export type Color = (typeof COLORS)[keyof typeof COLORS];

/**
 * A primary color as libraries show it in dark mode, where that differs. Black all but vanishes on
 * the libraries' dark backgrounds (about 1:1), so it becomes the neutral zinc a dark theme would use,
 * which still takes white text.
 */
export const DARK_COLORS: Partial<Record<Color, string>> = { [COLORS.black]: "#71717a" };

/** The demo options: the shell owns and changes them (store.ts), libraries only read them. */
export interface Controls {
  size: Size;
  /** Per demo row, so each component can be compared enabled and disabled on its own. */
  disabled: Record<DemoKey, boolean>;
  isDark: boolean;
  /** Show the package / repository / release / downloads rows. */
  stats: boolean;
  label: string;
  /** Which table (tab) is shown. */
  kind: Kind;
  /** Primary color forced on every styled and copy-paste library, or null for each library's own default. */
  color: Color | null;
  /** Column order per tab, by library id; a tab without one (or a library missing from it) keeps the default. */
  order: Partial<Record<Kind, string[]>>;
}

/** The demo options as libraries read them: `color` is the hex to show in the current mode (see DARK_COLORS). */
export type LibraryControls = Omit<Controls, "color" | "order"> & { color: string | null };

/** What the shell hands a library: where to render, and the options to render with. */
export interface MountContext {
  /** One cell per demo row; the library's demos are teleported into them (see DemoCells.vue). */
  cells: Record<DemoKey, HTMLElement>;
  /** Where the library should render dialogs and popups, inside its CSS scope. */
  overlay: HTMLElement;
  /** The shell's demo options: libraries read them, only the shell changes them. */
  controls: DeepReadonly<LibraryControls>;
  /** Shows an error the library's app ran into after mounting (in a render, watcher or handler) in its column header. */
  reportError: (error: unknown) => void;
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
  /** The library's documentation site, linked from its column header. */
  docs: string;
  /** npm package linked from the column header and used for npm stats; absent when it isn't on npm. */
  package?: string;
  /** Which tab the library is in; see KINDS. */
  kind: Kind;
  /** Column position within its tab, lowest first. */
  order: number;
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
  /**
   * Runs inside an effect scope of its own, which the shell stops to unmount the library: watchers
   * stop with it, and anything else is undone with `onScopeDispose()` (mountLibrary and
   * bindScopeVars already do).
   */
  mount: (context: MountContext) => void;
}

export interface Library extends LibraryMeta {
  /** Null for a stats-only library (`withoutDemos`). */
  load: (() => Promise<LibraryModule>) | null;
  /** Its logo, as a URL: src/libs/<id>/logo.svg (or .png / .ico where it has no SVG); null without one. */
  logo: string | null;
}
