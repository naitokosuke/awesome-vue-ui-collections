import { reactive, watch } from "vue";
import { DEMOS, type DemoKey, type Kind, KINDS } from "./libs/types";

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

const STORAGE_KEY = "awesome-vue-ui-collections:controls";

export interface Controls {
  size: Size;
  /** Per demo row, so each component can be compared enabled and disabled on its own. */
  disabled: Record<DemoKey, boolean>;
  dark: boolean;
  /** Show the package / repository / release / downloads rows. */
  stats: boolean;
  label: string;
  /** Which table (tab) is shown. */
  kind: Kind;
  /** Primary color forced on every styled and copy-paste library, or null for each library's own default. */
  color: Color | null;
}

/** Owned by the shell; library apps get it read-only through their mount context. */
export const controls = reactive<Controls>({
  size: "medium",
  disabled: Object.fromEntries(DEMOS.map((demo) => [demo, false])) as Record<DemoKey, boolean>,
  dark: false,
  stats: true,
  label: "Click me",
  kind: "styled",
  color: null,
  ...restore(),
});

// Per-viewer convenience only; the page works the same without it.
watch(controls, (value) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {}
});

/** The saved controls, field by field; anything missing, outdated or invalid keeps its default. */
function restore(): Partial<Controls> {
  let saved: unknown;
  try {
    saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
  } catch {
    return {};
  }
  if (typeof saved !== "object" || saved === null) return {};
  const { size, disabled, dark, stats, label, kind, color } = saved as Record<string, unknown>;
  const restored: Partial<Controls> = {};
  if (oneOf(SIZES, size)) restored.size = size;
  // `disabled` used to be one boolean for every row.
  if (typeof disabled === "object" && disabled !== null) {
    const rows = disabled as Record<string, unknown>;
    restored.disabled = Object.fromEntries(DEMOS.map((demo) => [demo, rows[demo] === true])) as Record<
      DemoKey,
      boolean
    >;
  }
  if (typeof dark === "boolean") restored.dark = dark;
  if (typeof stats === "boolean") restored.stats = stats;
  if (typeof label === "string") restored.label = label;
  if (oneOf(KINDS, kind)) restored.kind = kind;
  if (color === null || oneOf(Object.values(COLORS), color)) restored.color = color;
  return restored;
}

function oneOf<T>(values: readonly T[], value: unknown): value is T {
  return values.includes(value as T);
}
