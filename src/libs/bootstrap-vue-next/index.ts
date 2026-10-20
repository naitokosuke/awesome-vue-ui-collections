import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-vue-next/dist/bootstrap-vue-next.css";
import "./primary.css";
import { createBootstrap } from "bootstrap-vue-next";
import { mix, rgbChannels, shade, tint } from "../color";
import { bindScopeVars, mountLibrary } from "../mount";
import type { MountContext } from "../types";
import Demos from "./Demos.vue";

// bootstrap-vue-next doesn't export its version or expose its package.json through `exports`.
export { version } from "../../../node_modules/bootstrap-vue-next/package.json";

/** The `--bvn-*` vars read by primary.css, with Bootstrap's own tint/shade amounts. */
function primaryVars(hex: string, dark: boolean) {
  const link = dark ? tint(hex, 0.4) : hex;
  const linkHover = dark ? tint(link, 0.2) : shade(hex, 0.2);
  return {
    "--bvn-primary": hex,
    "--bvn-primary-rgb": rgbChannels(hex),
    "--bvn-primary-text-emphasis": dark ? tint(hex, 0.4) : shade(hex, 0.6),
    "--bvn-primary-bg-subtle": dark ? shade(hex, 0.8) : tint(hex, 0.8),
    "--bvn-primary-border-subtle": dark ? shade(hex, 0.4) : tint(hex, 0.6),
    "--bvn-link": link,
    "--bvn-link-rgb": rgbChannels(link),
    "--bvn-link-hover": linkHover,
    "--bvn-link-hover-rgb": rgbChannels(linkHover),
    "--bvn-btn-hover-bg": shade(hex, 0.15),
    "--bvn-btn-hover-border": shade(hex, 0.2),
    "--bvn-btn-active-bg": shade(hex, 0.2),
    "--bvn-btn-active-border": shade(hex, 0.25),
    "--bvn-btn-focus-shadow-rgb": rgbChannels(mix(hex, "#ffffff", 0.15)),
    "--bvn-focus-border": tint(hex, 0.5),
    "--bvn-focus-ring": `rgba(${rgbChannels(hex)}, 0.25)`,
    "--bvn-switch-focus-bg": `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='-4 -4 8 8'%3e%3ccircle r='3' fill='%23${tint(hex, 0.5).slice(1)}'/%3e%3c/svg%3e")`,
  };
}

export function mount(context: MountContext) {
  const { controls } = context;
  const stopColor = bindScopeVars(context, () => (controls.color ? primaryVars(controls.color, controls.dark) : null));
  const unmount = mountLibrary(context, Demos, (app) => {
    app.use(
      createBootstrap({
        // The registries plugin provides the modal manager, which toggles `modal-open` on <body>.
        registries: false,
        orchestrator: false,
        components: {
          // Render modals inside the overlay host and never lock <body> scroll / pad it.
          BModal: { teleportTo: context.overlay, bodyScrolling: true },
        },
      }),
    );
  });
  return () => {
    unmount();
    stopColor();
  };
}
