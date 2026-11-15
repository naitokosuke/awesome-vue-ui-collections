import "../headless-theme.css";
import "akaza-ui/dist/akaza-ui.css";
import { mountLibrary } from "../mount";
import type { MountContext } from "../types";
import Demos from "./Demos.vue";

export function mount(context: MountContext) {
  // No plugin: components are imported locally in Demos.vue.
  mountLibrary(context, Demos);
}
