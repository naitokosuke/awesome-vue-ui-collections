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

/** The part of unhead (Nuxt UI's head manager) used below; it isn't a dependency of this project. */
interface Head {
  hooks: {
    hook(
      name: "tags:resolve",
      fn: (ctx: { tags: { props: Record<string, unknown>; innerHTML?: string }[] }) => void,
    ): void;
  };
}

/**
 * Nuxt UI's colors plugin writes `:root, :host { --ui-color-* }` plus `.light` / `.dark`
 * `{ --ui-<color> }` into a runtime <style> that the build-time scoping never sees: onto the
 * whole page, and onto other libraries' `.dark` scopes. Same rewrite as scope-library-css.ts.
 */
function scopeColors(css: string) {
  const scope = `[data-lib="nuxt-ui"]`;
  return css
    .replaceAll(":root, :host, .light {", `:where(${scope}) {`)
    .replaceAll(":root, :host {", `:where(${scope}) {`)
    .replaceAll(".dark {", `:where(${scope}.dark) {`);
}

export function mount(context: MountContext) {
  const { controls } = context;
  mountLibrary(context, Demos, (app) => {
    app.use(ui);
    // The colors style goes through unhead; rewrite it before it's rendered into <head>.
    const head = app.config.globalProperties.$unhead as Head;
    head.hooks.hook("tags:resolve", ({ tags }) => {
      for (const tag of tags) {
        if (tag.props.id === "nuxt-ui-colors" && tag.innerHTML) tag.innerHTML = scopeColors(tag.innerHTML);
      }
    });
  });
  // `--ui-primary` resolves on the scope element, so it must be set here too, not just the scale.
  bindScopeVars(context, () => (controls.color ? primaryVars(controls.color, controls.dark) : null));
}
