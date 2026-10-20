import "../headless-theme.css";
import { createStackPlugin } from "@vuetify/v0";
import { mountLibrary } from "../mount";
import type { MountContext } from "../types";
import Demos from "./Demos.vue";

export { version } from "@vuetify/v0/package.json";

export function mount(context: MountContext) {
  // No Theme plugin: it would inject CSS variables at runtime, and the demos
  // use their own neutral tokens. The stack plugin only keeps the dialog
  // z-index registry per app instead of v0's module-level fallback.
  return mountLibrary(context, Demos, (app) => {
    app.use(createStackPlugin());
  });
}
