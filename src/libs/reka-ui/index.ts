import "../headless-theme.css";
import { mountLibrary } from "../mount";
import type { MountTargets } from "../types";
import Demos from "./Demos.vue";

export { version } from "reka-ui/package.json";

export function mount(targets: MountTargets) {
  // Components are imported locally in Demos.vue; the overlay host is set there
  // through <ConfigProvider teleport-to>.
  return mountLibrary(targets, Demos, () => {});
}
