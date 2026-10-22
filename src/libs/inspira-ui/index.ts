import "./style.css";
import { isLight } from "../color";
import { bindScopeVars, mountLibrary } from "../mount";
import type { MountContext } from "../types";
import Demos from "./Demos.vue";

/** Inspira's own near-black or near-white, whichever reads better on `hex`. */
const foreground = (hex: string) => (isLight(hex) ? "oklch(0.141 0.005 285.823)" : "oklch(0.985 0 0)");

export function mount(context: MountContext) {
  const { controls } = context;
  mountLibrary(context, Demos);
  // Inline vars on the scope elements win over both the `:root` and `.dark` token rules.
  bindScopeVars(context, () => {
    const hex = controls.color;
    if (!hex) return null;
    return {
      "--primary": hex,
      "--primary-foreground": foreground(hex),
      "--ring": hex,
      // IInput's hover glow (see style.css)
      "--blue-500": hex,
    };
  });
}
