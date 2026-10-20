import type { Plugin } from "vite-plus";

const MODULE_ID = "virtual:naive-ui-preflight.css";

/**
 * Exposes Naive UI's preflight (`body { font-size; line-height; … }`) as a CSS module.
 *
 * Naive injects it into <head> at runtime, out of reach of build/scope-library-css.ts, so the
 * runtime copy is turned off (`preflight-style-disabled`) and this module brings it back as
 * plain CSS that gets scoped like every other library's. It is rendered from Naive's own
 * css-render definition, an internal module: if naive-ui moves it, the build fails loudly.
 */
export function naiveUiPreflight(): Plugin {
  return {
    name: "naive-ui-preflight",
    resolveId(id) {
      if (id === MODULE_ID) return `\0${MODULE_ID}`;
    },
    async load(id) {
      if (id !== `\0${MODULE_ID}`) return;
      const { default: preflight } = await import("naive-ui/es/_styles/global/index.cssr.mjs");
      return preflight.render();
    },
  };
}
