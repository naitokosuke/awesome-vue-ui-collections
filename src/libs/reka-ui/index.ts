import { bindHeadlessTheme } from "../headless-theme";
import { mountLibrary } from "../mount";
import type { MountContext } from "../types";
import Demos from "./Demos.vue";

export function mount(context: MountContext) {
  bindHeadlessTheme(context);
  // Components are imported locally in Demos.vue; the overlay host is set there
  // through <ConfigProvider teleport-to>.
  mountLibrary(context, Demos);
}
