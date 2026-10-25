import type { LibraryMeta } from "../types.ts";

export const meta: LibraryMeta = {
  id: "nuxt-ui",
  name: "Nuxt UI",
  package: "@nuxt/ui",
  kind: "styled",
  order: 8,
  components: {
    button: { name: "UButton", docs: "https://ui.nuxt.com/docs/components/button" },
    input: { name: "UInput", docs: "https://ui.nuxt.com/docs/components/input" },
    select: { name: "USelect", docs: "https://ui.nuxt.com/docs/components/select" },
    switch: { name: "USwitch", docs: "https://ui.nuxt.com/docs/components/switch" },
    dialog: { name: "UModal", docs: "https://ui.nuxt.com/docs/components/modal" },
  },
  // The Tailwind entry compiled by @tailwindcss/vite
  cssMatch: ["/src/libs/nuxt-ui/style.css"],
  // Nuxt UI's `.dark { --ui-* }` tokens and Tailwind's `dark:` variant
  darkAttrs: { class: "dark" },
};
