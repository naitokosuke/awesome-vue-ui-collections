import type { LibraryMeta } from "../types.ts";

export const meta: LibraryMeta = {
  id: "tdesign",
  name: "TDesign",
  docs: "https://tdesign.tencent.com/vue-next/",
  package: "tdesign-vue-next",
  kind: "styled",
  order: 6,
  // The icon package injects its own stylesheet from JS (esm/style/index.css).
  components: {
    button: { name: "TButton", docs: "https://tdesign.tencent.com/vue-next/components/button" },
    input: { name: "TInput", docs: "https://tdesign.tencent.com/vue-next/components/input" },
    select: { name: "TSelect", docs: "https://tdesign.tencent.com/vue-next/components/select" },
    switch: { name: "TSwitch", docs: "https://tdesign.tencent.com/vue-next/components/switch" },
    dialog: { name: "TDialog", docs: "https://tdesign.tencent.com/vue-next/components/dialog" },
  },
  cssMatch: ["/node_modules/tdesign-vue-next/", "/node_modules/tdesign-icons-vue-next/"],
  // dist/tdesign.css switches its tokens on `:root[theme-mode='dark']`
  darkAttrs: { "theme-mode": "dark" },
};
