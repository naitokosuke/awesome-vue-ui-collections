import "@arco-design/web-vue/dist/arco.css";
import ArcoVue from "@arco-design/web-vue";
import { mix, rgbChannels, shade, tint } from "../color";
import { bindScopeVars, mountLibrary } from "../mount";
import type { MountContext } from "../types";
import Demos from "./Demos.vue";

// Components read `rgb(var(--primary-N))`, an "r, g, b" triplet. Step 6 is the base:
// light mode lightens 1-5 and darkens 7-10; dark mode fades 1-5 into the dark background
// and lightens 7-10 (like Arco's own dark palette).
function palette(base: string, dark: boolean): Record<string, string> {
  const below = dark
    ? [0.7, 0.55, 0.4, 0.25, 0.1].map((n) => mix(base, "#17171a", n))
    : [0.9, 0.72, 0.54, 0.36, 0.18].map((n) => tint(base, n));
  const above = dark
    ? [0.22, 0.44, 0.66, 0.88].map((n) => tint(base, n))
    : [0.17, 0.34, 0.52, 0.7].map((n) => shade(base, n));
  const steps = [...below, base, ...above];
  return Object.fromEntries(steps.map((color, i) => [`--primary-${i + 1}`, rgbChannels(color)]));
}

export function mount(context: MountContext) {
  const { controls } = context;
  mountLibrary(context, Demos, (app) => {
    app.use(ArcoVue);
  });
  bindScopeVars(context, () => (controls.color ? palette(controls.color, controls.dark) : null));
}
