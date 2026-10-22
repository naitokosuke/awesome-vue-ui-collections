import "./style.css";
import { luminance } from "../color";
import { bindScopeVars, mountLibrary } from "../mount";
import type { MountContext } from "../types";
import Demos from "./Demos.vue";

// Version of the shadcn-vue CLI that generated ./ui (its package.json isn't in `exports`).
export { version } from "../../../node_modules/shadcn-vue/package.json";

/** Black or white, whichever reads better on `hex` (WCAG relative luminance). */
function foreground(hex: string) {
  return luminance(hex) > 0.179 ? "oklch(0.145 0 0)" : "oklch(0.985 0 0)";
}

export function mount(context: MountContext) {
  const { controls } = context;
  const unmount = mountLibrary(context, Demos);
  // Inline vars on the scope elements win over both the `:root` and `.dark` token rules.
  const unbind = bindScopeVars(context, () => {
    const hex = controls.color;
    if (!hex) return null;
    return { "--primary": hex, "--primary-foreground": foreground(hex), "--ring": hex };
  });
  return () => {
    unbind();
    unmount();
  };
}
