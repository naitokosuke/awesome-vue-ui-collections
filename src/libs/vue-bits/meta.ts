import type { LibraryMeta } from "../types.ts";

export const meta: LibraryMeta = {
  id: "vue-bits",
  name: "Vue Bits",
  // Not on npm: components are copied from its registry (vue-bits.dev/r) with the shadcn or jsrepo
  // CLI. The `vue-bits` npm package is an unrelated Vue 2 library, so there are no npm stats.
  repository: "DavidHDev/vue-bits",
  kind: "fancy",
  order: 1,
  components: {
    button: { name: "SpecularButton", docs: "https://vue-bits.dev/components/specular-button" },
    input: { name: "CurvedInput", docs: "https://vue-bits.dev/components/curved-input" },
    select: { name: "OptionWheel", docs: "https://vue-bits.dev/components/option-wheel" },
  },
  // The Tailwind entry compiled by @tailwindcss/vite
  cssMatch: ["/src/libs/vue-bits/style.css"],
};
