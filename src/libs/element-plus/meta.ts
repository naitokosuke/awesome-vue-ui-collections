import type { LibraryMeta } from "../types.ts";

export const meta: LibraryMeta = {
  id: "element-plus",
  name: "Element Plus",
  docs: "https://element-plus.org/",
  package: "element-plus",
  kind: "styled",
  order: 2,
  components: {
    button: { name: "ElButton", docs: "https://element-plus.org/en-US/component/button.html" },
    input: { name: "ElInput", docs: "https://element-plus.org/en-US/component/input.html" },
    select: { name: "ElSelect", docs: "https://element-plus.org/en-US/component/select.html" },
    switch: { name: "ElSwitch", docs: "https://element-plus.org/en-US/component/switch.html" },
    dialog: { name: "ElDialog", docs: "https://element-plus.org/en-US/component/dialog.html" },
  },
  cssMatch: ["/node_modules/element-plus/"],
  // theme-chalk/dark/css-vars.css targets `html.dark`
  darkAttrs: { class: "dark" },
};
