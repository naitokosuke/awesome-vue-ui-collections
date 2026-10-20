import type { LibraryMeta } from "../types.ts";

// Headless: @vuetify/v0 ships no CSS. The plain look lives in Demos.vue.
export const meta: LibraryMeta = {
  id: "vuetify0",
  name: "Vuetify0",
  package: "@vuetify/v0",
  kind: "headless",
  components: {
    button: { name: "Button", docs: "https://0.vuetifyjs.com/components/actions/button" },
    input: { name: "Input", docs: "https://0.vuetifyjs.com/components/forms/input" },
    select: { name: "Select", docs: "https://0.vuetifyjs.com/components/forms/select" },
    switch: { name: "Switch", docs: "https://0.vuetifyjs.com/components/forms/switch" },
    dialog: { name: "Dialog", docs: "https://0.vuetifyjs.com/components/disclosure/dialog" },
  },
  cssMatch: [],
  // Demos.vue switches its own neutral tokens on this attribute
  darkAttrs: { "data-theme": "dark" },
};
