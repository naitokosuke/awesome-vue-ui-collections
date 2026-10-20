import "tdesign-vue-next/dist/tdesign.css";
import TDesign from "tdesign-vue-next";
import { controls } from "../../store";
import { mix, shade, tint } from "../color";
import { bindScopeVars, mountLibrary } from "../mount";
import type { MountTargets } from "../types";
import Demos from "./Demos.vue";

export const version: string = TDesign.version;

// TDesign's 10-step palette: light mode puts the brand at step 7 (lighter below, darker above);
// dark mode puts it at step 8 on #242424, with steps 1-5 faded into the background.
function palette(hex: string, dark: boolean): Record<string, string> {
  const steps = dark
    ? [
        ...[0.82, 0.76, 0.68, 0.6, 0.5].map((n) => mix(hex, "#242424", n)),
        shade(hex, 0.3),
        shade(hex, 0.15),
        hex,
        tint(hex, 0.18),
        tint(hex, 0.4),
      ]
    : [
        ...[0.94, 0.84, 0.7, 0.55, 0.38, 0.18].map((n) => tint(hex, n)),
        hex,
        shade(hex, 0.18),
        shade(hex, 0.36),
        shade(hex, 0.55),
      ];
  const step = (n: number) => steps[n - 1]!;
  // Semantic aliases, as tdesign.css maps them for each mode.
  return {
    ...Object.fromEntries(steps.map((color, i) => [`--td-brand-color-${i + 1}`, color])),
    "--td-brand-color": dark ? step(8) : step(7),
    "--td-brand-color-hover": dark ? step(7) : step(6),
    "--td-brand-color-focus": step(2),
    "--td-brand-color-active": dark ? step(9) : step(8),
    "--td-brand-color-disabled": step(3),
    "--td-brand-color-light": step(1),
    "--td-brand-color-light-hover": step(2),
  };
}

export function mount(targets: MountTargets) {
  const unmount = mountLibrary(targets, Demos, (app) => {
    app.use(TDesign);
  });
  const unbind = bindScopeVars(targets, () => (controls.color ? palette(controls.color, controls.dark) : null));
  return () => {
    unbind();
    unmount();
  };
}
