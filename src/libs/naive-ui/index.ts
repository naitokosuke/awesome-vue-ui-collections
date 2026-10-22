import "virtual:naive-ui-preflight.css";
import naive from "naive-ui";
import { mountLibrary } from "../mount";
import type { MountContext } from "../types";
import Demos from "./Demos.vue";

export function mount(context: MountContext) {
  mountLibrary(context, Demos, (app) => {
    app.use(naive);
  });
}
