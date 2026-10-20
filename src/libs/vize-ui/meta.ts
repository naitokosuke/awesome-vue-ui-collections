import type { LibraryMeta } from "../types.ts";

export const meta: LibraryMeta = {
  id: "vize-ui",
  name: "Vize UI",
  package: "@vizejs/ui",
  kind: "headless",
  components: {
    button: { name: "Button", docs: "https://vizejs.dev/guide/ui/button/index.html" },
    // Input inside a Field (which gives it the label).
    input: { name: "Input", docs: "https://vizejs.dev/guide/ui/input/index.html" },
    select: { name: "NativeSelect", docs: "https://vizejs.dev/guide/ui/native-select/index.html" },
    switch: { name: "Switch", docs: "https://vizejs.dev/guide/ui/switch/index.html" },
    dialog: { name: "Dialog", docs: "https://vizejs.dev/guide/ui/dialog/index.html" },
  },
  cssMatch: ["/node_modules/@vizejs/ui/"],
  // Not a Vize UI attribute: adapter.css keys the presets' light/dark switch off it.
  darkAttrs: { "data-theme": "dark" },
};
