import type { LibraryMeta } from "../types.ts";

export const meta: LibraryMeta = {
  id: "inspira-ui",
  name: "Inspira UI",
  // Components are copied into the project (./ui) from registry.inspira-ui.com with the shadcn-vue CLI.
  // There is no `inspira-ui` npm package; `@inspira-ui/plugins` (by the Inspira UI author) is the
  // runtime every component imports `cn` from, so its npm stats stand in for the library's.
  package: "@inspira-ui/plugins",
  kind: "copy-paste",
  // `@inspira-ui/plugins` points at its own repo; the components live here.
  repository: "unovue/inspira-ui",
  // The Tailwind entry compiled by @tailwindcss/vite
  components: {
    button: {
      name: "InteractiveHoverButton",
      docs: "https://inspira-ui.com/docs/en/components/buttons/interactive-hover-button",
    },
    input: { name: "IInput", docs: "https://inspira-ui.com/docs/en/components/input-and-forms/input" },
    dialog: { name: "AnimatedModal", docs: "https://inspira-ui.com/docs/en/components/miscellaneous/animated-modal" },
  },
  cssMatch: ["/src/libs/inspira-ui/style.css"],
  // Inspira's `.dark { --* }` tokens and the `dark:` variant
  darkAttrs: { class: "dark" },
};
