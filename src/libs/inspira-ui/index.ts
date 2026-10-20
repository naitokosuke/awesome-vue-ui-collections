import "./style.css";
import { controls } from "../../store";
import { luminance } from "../color";
import { bindScopeVars, mountLibrary } from "../mount";
import type { MountTargets } from "../types";
import Demos from "./Demos.vue";

// Inspira UI itself isn't versioned on npm; this is the `@inspira-ui/plugins` runtime the components import.
export { version } from "@inspira-ui/plugins/package.json";

/** Black or white, whichever reads better on `hex` (WCAG relative luminance). */
function foreground(hex: string) {
  return luminance(hex) > 0.179 ? "oklch(0.141 0.005 285.823)" : "oklch(0.985 0 0)";
}

export function mount(targets: MountTargets) {
  const unmount = mountLibrary(targets, Demos, () => {});
  // Inline vars on the scope elements win over both the `:root` and `.dark` token rules.
  const unbind = bindScopeVars(targets, () => {
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
  return () => {
    unbind();
    unmount();
  };
}
