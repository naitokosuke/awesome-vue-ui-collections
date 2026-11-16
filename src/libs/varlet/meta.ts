import type { LibraryMeta } from "../types.ts";

export const meta: LibraryMeta = {
  id: "varlet",
  name: "Varlet",
  docs: "https://varletjs.org/",
  package: "@varlet/ui",
  kind: "styled",
  order: 9,
  components: {
    button: { name: "VarButton", docs: "https://varletjs.org/#/en-US/button" },
    input: { name: "VarInput", docs: "https://varletjs.org/#/en-US/input" },
    select: { name: "VarSelect", docs: "https://varletjs.org/#/en-US/select" },
    switch: { name: "VarSwitch", docs: "https://varletjs.org/#/en-US/switch" },
    dialog: { name: "VarDialog", docs: "https://varletjs.org/#/en-US/dialog" },
  },
  cssMatch: ["/node_modules/@varlet/ui/"],
  // No darkAttrs: Varlet's dark theme is a set of CSS variables (Themes.dark),
  // applied inline on the cells and the overlay host (see index.ts).
};
