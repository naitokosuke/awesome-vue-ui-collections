import "../headless-theme.css";
import { mountLibrary } from "../mount";
import type { MountContext } from "../types";
import Demos from "./Demos.vue";

export { version } from "reka-ui/package.json";

export function mount(context: MountContext) {
  // Components are imported locally in Demos.vue; the overlay host is set there
  // through <ConfigProvider teleport-to>.
  mountLibrary(context, Demos);
}
