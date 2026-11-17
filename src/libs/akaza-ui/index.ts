import "akaza-ui/dist/akaza-ui.css";
import { bindHeadlessTheme } from "../headless-theme";
import { mountLibrary } from "../mount";
import type { MountContext } from "../types";
import Demos from "./Demos.vue";

export function mount(context: MountContext) {
  bindHeadlessTheme(context);
  // No plugin: components are imported locally in Demos.vue.
  mountLibrary(context, Demos);
}
