import "@astryx-vue/themes/neutral.css";
import { tint } from "../color";
import { bindScopeVars, mountLibrary } from "../mount";
import type { MountContext } from "../types";
import Demos from "./Demos.vue";

export { version } from "@astryx-vue/core/package.json";

/** The neutral theme's accent tokens (primary button, switch, focus ring) as one color. */
function accentVars(hex: string) {
  return {
    "--astryx-color-accent": hex,
    "--astryx-color-on-accent": "#ffffff",
    "--astryx-color-text-accent": hex,
    "--astryx-color-icon-accent": hex,
    "--astryx-color-accent-muted": tint(hex, 0.9),
  };
}

export function mount(context: MountContext) {
  const { controls } = context;
  const stopColor = bindScopeVars(context, () => (controls.color ? accentVars(controls.color) : null));
  const stopAdopting = adoptListboxes(context);
  const unmount = mountLibrary(context, Demos);
  return () => {
    unmount();
    stopAdopting();
    stopColor();
  };
}

/**
 * Selector teleports its listbox to `<body>` (a fixed `to: "body"`), outside this library's CSS
 * scope, where it would render unstyled. Move it into the overlay host as soon as it lands there;
 * it is fixed-positioned, and Vue keeps patching and removing it wherever it lives.
 */
function adoptListboxes(context: MountContext) {
  const adopt = (node: Node) => {
    if (node instanceof HTMLElement && node.classList.contains("astryx-selector-listbox")) context.overlay.append(node);
  };
  const observer = new MutationObserver((records) => records.forEach((record) => record.addedNodes.forEach(adopt)));
  observer.observe(document.body, { childList: true });
  return () => observer.disconnect();
}
