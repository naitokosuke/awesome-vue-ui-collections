import "virtual:naive-ui-preflight.css";
import naive from "naive-ui";
import { mountLibrary, workaround } from "../mount";
import type { MountContext } from "../types";
import Demos from "./Demos.vue";

/** vueuc's viewport measurer, kept while Naive is unmounted (see below). */
let viewMeasurer: Element | null = null;

export function mount(context: MountContext) {
  workaround({
    reason:
      "vueuc (Naive UI's popup positioning) appends `#v-binder-view-measurer` to <body> when a popup first opens, " +
      "keeps it by reference and never removes it: it's taken off with Naive and put back when Naive mounts again",
    apply: () => {
      if (viewMeasurer) document.body.append(viewMeasurer);
      return () => {
        viewMeasurer = document.getElementById("v-binder-view-measurer");
        viewMeasurer?.remove();
      };
    },
  });
  mountLibrary(context, Demos, (app) => {
    app.use(naive);
  });
}
