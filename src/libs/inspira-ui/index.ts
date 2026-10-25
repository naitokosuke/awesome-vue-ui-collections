import "./style.css";
import { wantsDarkText } from "../color";
import { bindScopeVars, mountLibrary } from "../mount";
import type { MountContext } from "../types";
import Demos from "./Demos.vue";

/** Inspira's own near-white, or its near-black where dark text reads better on `hex` (see wantsDarkText). */
const foreground = (hex: string) => (wantsDarkText(hex) ? "oklch(0.141 0.005 285.823)" : "oklch(0.985 0 0)");

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
