import type { LibraryMeta } from "../types.ts";

export const meta: LibraryMeta = {
  id: "vant",
  name: "Vant",
  package: "vant",
  kind: "styled",
  components: {
    button: { name: "VanButton", docs: "https://vant-ui.github.io/vant/#/en-US/button" },
    input: { name: "VanField", docs: "https://vant-ui.github.io/vant/#/en-US/field" },
    select: { name: "VanDropdownMenu", docs: "https://vant-ui.github.io/vant/#/en-US/dropdown-menu" },
    switch: { name: "VanSwitch", docs: "https://vant-ui.github.io/vant/#/en-US/switch" },
    dialog: { name: "VanDialog", docs: "https://vant-ui.github.io/vant/#/en-US/dialog" },
  },
  cssMatch: ["/node_modules/vant/"],
  // Instead of <van-config-provider>, which writes `van-theme-*` to <html>.
  darkAttrs: { class: "van-theme-dark" },
};
