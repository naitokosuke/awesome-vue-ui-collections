import "./style.css";
import ui from "@nuxt/ui/vue-plugin";
import { shade, tint } from "../color";
import { bindScopeVars, mountLibrary } from "../mount";
import type { MountContext } from "../types";
import Demos from "./Demos.vue";

// `@nuxt/ui` doesn't expose its package.json through `exports`.
export { version } from "../../../node_modules/@nuxt/ui/package.json";

// Shade scale around the chosen color (= 500), like the Tailwind palettes Nuxt UI maps.
const SCALE: Record<number, (hex: string) => string> = {
  50: (hex) => tint(hex, 0.95),
  100: (hex) => tint(hex, 0.9),
  200: (hex) => tint(hex, 0.75),
  300: (hex) => tint(hex, 0.55),
  400: (hex) => tint(hex, 0.35),
  500: (hex) => hex,
  600: (hex) => shade(hex, 0.15),
  700: (hex) => shade(hex, 0.3),
  800: (hex) => shade(hex, 0.45),
  900: (hex) => shade(hex, 0.6),
  950: (hex) => shade(hex, 0.75),
};

/** Nuxt UI's runtime `nuxt-ui-colors` style: `--ui-color-primary-*` scale, `--ui-primary` = 500 (light) / 400 (dark). */
function primaryVars(hex: string, dark: boolean) {
  const vars: Record<string, string> = {};
  for (const [step, derive] of Object.entries(SCALE)) vars[`--ui-color-primary-${step}`] = derive(hex);
  vars["--ui-primary"] = vars[`--ui-color-primary-${dark ? 400 : 500}`]!;
  return vars;
}

export function mount(context: MountContext) {
  const { controls } = context;
  const unmount = mountLibrary(context, Demos, (app) => {
    app.use(ui);
  });
  // `--ui-primary` resolves on `:root`, so it must be set here too, not just the scale.
  const unbind = bindScopeVars(context, () => (controls.color ? primaryVars(controls.color, controls.dark) : null));
  return () => {
    unbind();
    unmount();
  };
}
