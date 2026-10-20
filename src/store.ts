import { reactive, watch } from "vue";
import { DEMOS, type DemoKey, type Kind } from "./libs/types";

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

/** Shared by the shell and every library app; they all run on the same Vue runtime. */
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

function restore(): Partial<Controls> {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
    // `disabled` used to be one boolean for every row.
    if (typeof saved.disabled !== "object") delete saved.disabled;
    return saved;
  } catch {
    return {};
  }
}
