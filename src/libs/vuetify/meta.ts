import type { LibraryMeta } from "../types.ts";

export const meta: LibraryMeta = {
  id: "vuetify",
  name: "Vuetify",
  package: "vuetify",
  kind: "styled",
  order: 1,
  components: {
    button: { name: "VBtn", docs: "https://vuetifyjs.com/en/components/buttons/" },
    input: { name: "VTextField", docs: "https://vuetifyjs.com/en/components/text-fields/" },
    select: { name: "VSelect", docs: "https://vuetifyjs.com/en/components/selects/" },
    switch: { name: "VSwitch", docs: "https://vuetifyjs.com/en/components/switches/" },
    dialog: { name: "VDialog", docs: "https://vuetifyjs.com/en/components/dialogs/" },
  },
  cssMatch: ["/node_modules/vuetify/"],
};
