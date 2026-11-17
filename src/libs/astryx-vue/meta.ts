import type { LibraryMeta } from "../types.ts";

// An unofficial Vue port of Meta's Astryx design system.
export const meta: LibraryMeta = {
  id: "astryx-vue",
  name: "Astryx Vue",
  docs: "https://astryx-vue.pages.dev/",
  package: "@astryx-vue/core",
  kind: "styled",
  order: 12,
  // Component structure (@astryx-vue/core) and the neutral theme (@astryx-vue/themes).
  components: {
    button: { name: "Button", docs: "https://astryx-vue.pages.dev/en/components/button" },
    input: { name: "TextInput", docs: "https://astryx-vue.pages.dev/en/components/text-input" },
    select: { name: "Selector", docs: "https://astryx-vue.pages.dev/en/components/selector" },
    switch: { name: "Switch", docs: "https://astryx-vue.pages.dev/en/components/switch" },
    dialog: { name: "Dialog", docs: "https://astryx-vue.pages.dev/en/components/dialog" },
  },
  cssMatch: ["/node_modules/@astryx-vue/"],
  // The theme's tokens are light-dark() pairs following color-scheme, which defaults to the OS
  // setting; these attributes pin it to the page's theme instead.
  darkAttrs: { "data-astryx-color-mode": "dark" },
  lightAttrs: { "data-astryx-color-mode": "light" },
};
