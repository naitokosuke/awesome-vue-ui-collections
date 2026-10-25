import "virtual:naive-ui-preflight.css";
import naive from "naive-ui";
import { onScopeDispose } from "vue";
import { mountLibrary } from "../mount";
import type { MountContext } from "../types";
import Demos from "./Demos.vue";

/**
 * vueuc's viewport measurer (Naive's popup positioning), taken off <body> while Naive is unmounted.
 * vueuc appends it to <body> the first time a popup opens and keeps it by reference from then on,
 * so it can't simply be removed: it's put back when Naive mounts again.
 */
let viewMeasurer: Element | null = null;

export function mount(context: MountContext) {
  if (viewMeasurer) document.body.append(viewMeasurer);
  mountLibrary(context, Demos, (app) => {
    app.use(naive);
  });
  // Workaround: nothing in vueuc removes the measurer.
  onScopeDispose(() => {
    viewMeasurer = document.getElementById("v-binder-view-measurer");
    viewMeasurer?.remove();
  });
}
