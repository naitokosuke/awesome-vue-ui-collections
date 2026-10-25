import type { LibraryMeta } from "../types.ts";

export const meta: LibraryMeta = {
  id: "quasar",
  name: "Quasar",
  package: "quasar",
  kind: "styled",
  order: 4,
  components: {
    button: { name: "QBtn", docs: "https://quasar.dev/vue-components/button" },
    input: { name: "QInput", docs: "https://quasar.dev/vue-components/input" },
    select: { name: "QSelect", docs: "https://quasar.dev/vue-components/select" },
    switch: { name: "QToggle", docs: "https://quasar.dev/vue-components/toggle" },
    dialog: { name: "QDialog", docs: "https://quasar.dev/vue-components/dialog" },
  },
  cssMatch: ["/node_modules/quasar/", "/node_modules/@quasar/extras/"],
  // quasar.css styles dark mode via `body.body--dark ...`
  darkAttrs: { class: "body--dark" },
};
