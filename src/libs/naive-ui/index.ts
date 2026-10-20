import "virtual:naive-ui-preflight.css";
import naive from "naive-ui";
import { mountLibrary } from "../mount";
import type { MountContext } from "../types";
import Demos from "./Demos.vue";

export { version } from "naive-ui";

export function mount(context: MountContext) {
  return mountLibrary(context, Demos, (app) => {
    app.use(naive);
  });
}
