import "vant/lib/index.css";
import Vant, { Popup } from "vant";
import { bindScopeVars, mountLibrary, workaround } from "../mount";
import type { MountContext } from "../types";
import Demos from "./Demos.vue";

export function mount(context: MountContext) {
  const { controls } = context;
  const props = Popup.props as Record<string, { type?: unknown; default?: unknown }>;
  workaround({
    reason:
      "Vant's DropdownItem renders a Popup without forwarding `lock-scroll`, whose lock adds a class to <body>: " +
      "Popup's `lockScroll` defaults to false while Vant is mounted (Dialog turns it off with its own prop)",
    // Flipped before this app normalizes Popup's props.
    assumes: () => props.lockScroll?.default === true,
    apply: () => {
      const { lockScroll } = props;
      props.lockScroll = { type: Boolean, default: false };
      return () => {
        props.lockScroll = lockScroll!;
      };
    },
  });

  mountLibrary(context, Demos, (app) => {
    app.use(Vant);
  });
  // Vant has no shades: button, switch, dropdown and dialog all derive from this one
  // variable (also in dark mode), and pressed states are an opacity overlay.
  bindScopeVars(context, () => (controls.color ? { "--van-primary-color": controls.color } : null));
}
