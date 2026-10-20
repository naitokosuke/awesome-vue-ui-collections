import type { LibraryMeta } from "../types.ts";

export const meta: LibraryMeta = {
  id: "nuxt-ui",
  name: "Nuxt UI",
  package: "@nuxt/ui",
  kind: "styled",
  // The Tailwind entry compiled by @tailwindcss/vite
  components: {
    button: { name: "UButton", docs: "https://ui.nuxt.com/docs/components/button" },
    input: { name: "UInput", docs: "https://ui.nuxt.com/docs/components/input" },
    select: { name: "USelect", docs: "https://ui.nuxt.com/docs/components/select" },
    switch: { name: "USwitch", docs: "https://ui.nuxt.com/docs/components/switch" },
    dialog: { name: "UModal", docs: "https://ui.nuxt.com/docs/components/modal" },
  },
  cssMatch: ["/src/libs/nuxt-ui/style.css"],
  // Nuxt UI's `.dark { --ui-* }` tokens and Tailwind's `dark:` variant
  darkAttrs: { class: "dark" },
};
