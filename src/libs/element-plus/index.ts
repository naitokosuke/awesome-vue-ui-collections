import "element-plus/dist/index.css";
import "element-plus/theme-chalk/dark/css-vars.css";
import ElementPlus from "element-plus";
import { mix, rgbChannels, shade, tint } from "../color";
import { bindScopeVars, mountLibrary, workaround } from "../mount";
import type { MountContext } from "../types";
import Demos from "./Demos.vue";

// Same mixing as theme-chalk: light-N mixes N0% of the background in (#141414 in dark mode),
// dark-2 mixes 20% black (20% white in dark mode).
function palette(hex: string, dark: boolean): Record<string, string> {
  const bg = dark ? "#141414" : "#ffffff";
  return {
    "--el-color-primary": hex,
    "--el-color-primary-rgb": rgbChannels(hex),
    ...Object.fromEntries([3, 5, 7, 8, 9].map((n) => [`--el-color-primary-light-${n}`, mix(hex, bg, n / 10)])),
    "--el-color-primary-dark-2": dark ? tint(hex, 0.2) : shade(hex, 0.2),
  };
}

export function mount(context: MountContext) {
  const { controls } = context;
  mountLibrary(context, Demos, (app) => {
    app.use(ElementPlus);
  });
  workaround({
    reason:
      "Element Plus's poppers each append an empty `#el-popper-container-<n>` to <body>, even with an `append-to`, " +
      "and nothing removes it: they're taken away with the library (Element Plus recreates one whenever it's missing)",
    apply: () => () => {
      for (const el of document.querySelectorAll('body > [id^="el-popper-container-"]')) el.remove();
    },
  });
  bindScopeVars(context, () => (controls.color ? palette(controls.color, controls.isDark) : null));
}
