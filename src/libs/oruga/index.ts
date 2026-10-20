import "@oruga-ui/theme-oruga/style.css";
import "./dark.css";
import { createOruga } from "@oruga-ui/oruga-next";
import { shade, tint } from "../color";
import { bindScopeVars, mountLibrary } from "../mount";
import type { MountContext } from "../types";
import Demos from "./Demos.vue";

// oruga-next exports no version constant and its `exports` map hides package.json.
export { version } from "../../../node_modules/@oruga-ui/oruga-next/package.json";

/** theme-oruga's primary tokens; component tokens (button, switch, …) derive from them. */
function primaryVars(hex: string) {
  return {
    "--oruga-primary": hex,
    "--oruga-primary-invert": "#ffffff",
    "--oruga-primary-focus": `${hex}40`,
    "--oruga-primary-lighter": tint(hex, 0.9),
    "--oruga-primary-darker": shade(hex, 0.1),
  };
}

export function mount(context: MountContext) {
  const { controls } = context;
  // Inline on the scope elements, so it also beats ./dark.css in dark mode.
  const stopColor = bindScopeVars(context, () => (controls.color ? primaryVars(controls.color) : null));
  const unmount = mountLibrary(context, Demos, (app) => {
    app.use(
      createOruga({
        // Every teleported component (dialog, dropdown, …) goes to the overlay host.
        teleportTarget: context.overlay,
        dialog: {
          teleport: true,
          // The dialog always toggles a scroll class on <body> (`o-scroll-clip`),
          // and with blockScroll=false it also writes `body.style.top`. Keep
          // blockScroll on and strip the class, so nothing touches <body>.
          blockScroll: true,
          transformClasses: (classes: string) => classes.replace(/\bo-scroll-clip\b/g, "").trim(),
        },
      }),
    );
  });
  return () => {
    unmount();
    stopColor();
  };
}
