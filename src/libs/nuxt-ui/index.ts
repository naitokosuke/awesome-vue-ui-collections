import "./style.css";
import ui from "@nuxt/ui/vue-plugin";
import { shade, tint } from "../color";
import { bindScopeVars, mountLibrary, workaround } from "../mount";
import type { MountContext } from "../types";
import Demos from "./Demos.vue";

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
    const head = app.config.globalProperties.$unhead as Head | undefined;
    const reason =
      "Nuxt UI's colors plugin writes `:root, :host` and `.dark` rules into a runtime <style>, out of reach of the " +
      "build-time scoping: it's rewritten to this library's scope as unhead resolves it";
    workaround({
      reason,
      assumes: () => typeof head?.hooks.hook === "function",
      apply: () => {
        head!.hooks.hook("tags:resolve", ({ tags }) => {
          for (const tag of tags) {
            if (tag.props.id !== "nuxt-ui-colors" || !tag.innerHTML) continue;
            tag.innerHTML = scopeColors(tag.innerHTML);
            // The rewrite matches Nuxt UI's exact text; anything it missed would reach the whole page.
            if (/:root|:host|\.(?:dark|light)\s*\{/.test(tag.innerHTML)) {
              context.reportError(new Error(`Workaround no longer holds: ${reason}`));
            }
          }
        });
        // The hook belongs to this app's unhead instance, which goes with the app.
        return () => {};
      },
    });
  });
  // `--ui-primary` resolves on the scope element, so it must be set here too, not just the scale.
  bindScopeVars(context, () => (controls.color ? primaryVars(controls.color, controls.dark) : null));
}
