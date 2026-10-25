import "@varlet/ui/es/varlet.css";
import "./measure.css";
import Varlet, { Dialog, Menu, Themes } from "@varlet/ui";
import { hexToRgb } from "../color";
import { bindScopeVars, mountLibrary, workaround } from "../mount";
import type { MountContext } from "../types";
import Demos from "./Demos.vue";

const darkVars = Object.fromEntries(
  Object.entries(Themes.dark).map(([key, value]) => [
    key.startsWith("--") ? key : `--${key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}`,
    String(value),
  ]),
);

/** Varlet's colors are `h, s%, l%` triplets; every primary color var derives from these two. */
function primaryVars(hex: string) {
  const hsl = hexToHsl(hex);
  return { "--hsl-primary": hsl, "--hsl-primary-container": hsl };
}

/** A component's `props`, which Varlet's types leave out. */
const propsOf = (component: unknown) => (component as { props: Record<string, unknown> }).props;

/**
 * `target.setPropsDefaults()` as a workaround, undone with the library. Varlet replaces each named
 * entry of the component's `props` object, so the original entries are put back as they were.
 */
function setPropsDefaults(
  reason: string,
  target: { setPropsDefaults?: (defaults: Record<string, unknown>) => void },
  props: Record<string, unknown>,
  defaults: Record<string, unknown>,
) {
  workaround({
    reason,
    assumes: () => typeof target.setPropsDefaults === "function" && Object.keys(defaults).every((key) => key in props),
    apply: () => {
      const original = Object.fromEntries(Object.keys(defaults).map((key) => [key, props[key]]));
      target.setPropsDefaults!(defaults);
      return () => Object.assign(props, original);
    },
  });
}

function hexToHsl(hex: string) {
  const [r, g, b] = hexToRgb(hex).map((channel) => channel / 255) as [number, number, number];
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  const l = (max + min) / 2;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  const h = d === 0 ? 0 : max === r ? ((g - b) / d + 6) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return `${Math.round(h * 60)}, ${Math.round(s * 1000) / 10}%, ${Math.round(l * 1000) / 10}%`;
}

export function mount(context: MountContext) {
  const { controls } = context;
  setPropsDefaults(
    "Varlet's Select renders its options through an internal <var-menu> that teleports to <body>, with no prop " +
      "to change that: Menu's `teleport` defaults to the overlay host while Varlet is mounted",
    Menu,
    propsOf(Menu),
    { teleport: context.overlay },
  );
  setPropsDefaults(
    "Varlet's Dialog teleports to <body> and adds `var--lock` to it: its `teleport` defaults to the overlay host " +
      "and `lockScroll` to false while Varlet is mounted",
    // `Dialog` is the function API; the props are those of the component it renders.
    Dialog,
    propsOf(Dialog.Component),
    { teleport: context.overlay, lockScroll: false },
  );

  // `StyleProvider(vars)` would write the theme to `:root`; instead the dark theme and the
  // chosen primary go inline on the scope elements (cells + overlay host), where Varlet's
  // `:root` vars are declared, so derived vars like `--color-primary` pick them up.
  bindScopeVars(context, () => {
    const vars = { ...(controls.dark ? darkVars : {}), ...(controls.color ? primaryVars(controls.color) : {}) };
    return Object.keys(vars).length ? vars : null;
  });

  mountLibrary(context, Demos, (app) => {
    app.use(Varlet);
  });
}
