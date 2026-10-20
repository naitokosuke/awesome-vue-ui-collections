import type { LibraryMeta } from "../types.ts";

export const meta: LibraryMeta = {
  id: "shadcn-vue",
  name: "shadcn-vue",
  // Components are copied into the project (./ui); `shadcn-vue` is the CLI that generates them,
  // so its npm stats stand in for the library's.
  package: "shadcn-vue",
  kind: "copy-paste",
  // The Tailwind entry compiled by @tailwindcss/vite
  components: {
    button: { name: "Button", docs: "https://www.shadcn-vue.com/docs/components/button" },
    input: { name: "Input", docs: "https://www.shadcn-vue.com/docs/components/input" },
    select: { name: "Select", docs: "https://www.shadcn-vue.com/docs/components/select" },
    switch: { name: "Switch", docs: "https://www.shadcn-vue.com/docs/components/switch" },
    dialog: { name: "Dialog", docs: "https://www.shadcn-vue.com/docs/components/dialog" },
  },
  cssMatch: ["/src/libs/shadcn-vue/style.css"],
  // shadcn's `.dark { --* }` tokens and the `dark:` variant
  darkAttrs: { class: "dark" },
};
