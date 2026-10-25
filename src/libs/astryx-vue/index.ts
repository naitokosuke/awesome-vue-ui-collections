import "@astryx-vue/themes/neutral.css";
import { tint } from "../color";
import { bindScopeVars, mountLibrary, workaround } from "../mount";
import type { MountContext } from "../types";
import Demos from "./Demos.vue";

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
  bindScopeVars(context, () => (controls.color ? accentVars(controls.color) : null));
  workaround({
    reason:
      "Astryx Vue's Selector teleports its listbox to <body> (its `to` is fixed), outside the CSS scope: " +
      "it's moved into the overlay host as soon as it lands there (it's fixed-positioned, and Vue keeps patching it there)",
    apply: () => {
      const adopt = (node: Node) => {
        if (node instanceof HTMLElement && node.classList.contains("astryx-selector-listbox")) {
          context.overlay.append(node);
        }
      };
      const observer = new MutationObserver((records) => records.forEach((record) => record.addedNodes.forEach(adopt)));
      observer.observe(document.body, { childList: true });
      return () => observer.disconnect();
    },
  });
  mountLibrary(context, Demos);
}
