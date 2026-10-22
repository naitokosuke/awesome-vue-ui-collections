import { reactive, watch } from "vue";
import { COLORS, type Controls, DEMOS, type DemoKey, KINDS, SIZES } from "./libs/types";

const STORAGE_KEY = "awesome-vue-ui-collections:controls";

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
