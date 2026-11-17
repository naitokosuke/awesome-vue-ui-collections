import "./headless-theme.css";
import { readableOn } from "./color";
import { bindScopeVars } from "./mount";
import type { MountContext } from "./types";

/**
 * The shared headless look (headless-theme.css), with its accent following the selected primary
 * color: headless libraries ship no colors of their own, so this is the one place to set it.
 */
export function bindHeadlessTheme(context: MountContext) {
  bindScopeVars(context, () => {
    const color = context.controls.color;
    return color ? { "--hl-accent": color, "--hl-accent-fg": readableOn(color) } : null;
  });
}
