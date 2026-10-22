import "vant/lib/index.css";
import Vant, { Popup } from "vant";
import { onScopeDispose } from "vue";
import { bindScopeVars, mountLibrary } from "../mount";
import type { MountContext } from "../types";
import Demos from "./Demos.vue";

export function mount(context: MountContext) {
  const { controls } = context;
  // Workaround: DropdownItem renders a Popup without forwarding `lock-scroll`, and the
  // lock adds `van-overflow-hidden` to <body>. Flip Popup's default before this app
  // normalizes its props, and put it back with the library; Dialog still receives
  // `:lock-scroll="false"` explicitly.
  const props = Popup.props as Record<string, unknown>;
  const { lockScroll } = props;
  props.lockScroll = { type: Boolean, default: false };
  onScopeDispose(() => {
    props.lockScroll = lockScroll;
  });

  mountLibrary(context, Demos, (app) => {
    app.use(Vant);
  });
  // Vant has no shades: button, switch, dropdown and dialog all derive from this one
  // variable (also in dark mode), and pressed states are an opacity overlay.
  bindScopeVars(context, () => (controls.color ? { "--van-primary-color": controls.color } : null));
}
