// Headless components + optional CSS: base tokens, the official "headless" preset (no palette
// of its own), and the visual layers of the components used in the demos. Colors come from the
// shared headless theme (see adapter.css), like the other headless libraries.
import "../headless-theme.css";
import "@vizejs/ui/theme.css";
import "@vizejs/ui/theme-preset-headless.css";
import "@vizejs/ui/component-button.css";
import "@vizejs/ui/component-input.css";
import "@vizejs/ui/component-switch.css";
import "@vizejs/ui/component-dialog.css";
import "./adapter.css";
import { mountLibrary } from "../mount";
import type { MountTargets } from "../types";
import Demos from "./Demos.vue";

// @vizejs/ui exports no version and doesn't expose its package.json through `exports`.
export { version } from "../../../node_modules/@vizejs/ui/package.json";

export function mount(targets: MountTargets) {
  // No plugin: components are imported locally in Demos.vue.
  return mountLibrary(targets, Demos, () => {});
}
