import type { LibraryMeta } from "../types.ts";

// Headless: akaza-ui.css only lays out the primitives (positioning, transitions). The plain look lives in Demos.vue.
export const meta: LibraryMeta = {
  id: "akaza-ui",
  name: "Akaza UI",
  docs: "https://akaza-ui.com/",
  package: "akaza-ui",
  kind: "headless",
  order: 4,
  // The npm package has no `repository` field.
  repository: "igris-labs/akaza-ui",
  components: {
    button: { name: "Button", docs: "https://akaza-ui.com/components/button" },
    // Input inside a Field (which gives it the label).
    input: { name: "Input", docs: "https://akaza-ui.com/components/input" },
    select: { name: "Select", docs: "https://akaza-ui.com/components/select" },
    switch: { name: "Switch", docs: "https://akaza-ui.com/components/switch" },
    dialog: { name: "Dialog", docs: "https://akaza-ui.com/components/dialog" },
  },
  cssMatch: ["/node_modules/akaza-ui/"],
  // Not an Akaza UI attribute: the shared headless theme switches on it.
  darkAttrs: { "data-theme": "dark" },
};
