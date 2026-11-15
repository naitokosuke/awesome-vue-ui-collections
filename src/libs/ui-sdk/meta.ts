import type { LibraryMeta } from "../types.ts";

// Headless: UI SDK ships behaviors and no CSS. The plain look lives in Demos.vue.
export const meta: LibraryMeta = {
  id: "ui-sdk",
  name: "UI SDK",
  package: "@ui-sdk/vue",
  kind: "headless",
  order: 5,
  components: {
    button: { name: "Button", docs: "https://ui-sdk.dev/docs/vue/components/button" },
    // Input inside a Field (which gives it the label).
    input: { name: "Input", docs: "https://ui-sdk.dev/docs/vue/components/input" },
    select: { name: "Select", docs: "https://ui-sdk.dev/docs/vue/components/select" },
    switch: { name: "Switch", docs: "https://ui-sdk.dev/docs/vue/components/switch" },
    dialog: { name: "Dialog", docs: "https://ui-sdk.dev/docs/vue/components/dialog" },
  },
  cssMatch: [],
  // Not a UI SDK attribute: the shared headless theme switches on it.
  darkAttrs: { "data-theme": "dark" },
};
