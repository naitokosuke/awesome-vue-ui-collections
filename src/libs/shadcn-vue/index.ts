import "./style.css";
import { luminance } from "../color";
import { bindScopeVars, mountLibrary } from "../mount";
import type { MountContext } from "../types";
import Demos from "./Demos.vue";

/** Black or white, whichever reads better on `hex` (WCAG relative luminance). */
function foreground(hex: string) {
  return luminance(hex) > 0.179 ? "oklch(0.145 0 0)" : "oklch(0.985 0 0)";
}

export function mount(context: MountContext) {
  const { controls } = context;
  mountLibrary(context, Demos);
  // Inline vars on the scope elements win over both the `:root` and `.dark` token rules.
  bindScopeVars(context, () => {
    const hex = controls.color;
    if (!hex) return null;
    return { "--primary": hex, "--primary-foreground": foreground(hex), "--ring": hex };
  });
}
