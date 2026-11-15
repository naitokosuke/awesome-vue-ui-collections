import type { LibraryMeta } from "../types.ts";

export const meta: LibraryMeta = {
  id: "ai-elements-vue",
  name: "AI Elements Vue",
  // Components are copied into the project (./ui) on top of shadcn-vue; `ai-elements-vue` is the
  // CLI that adds them, so its npm stats stand in for the library's.
  package: "ai-elements-vue",
  kind: "copy-paste",
  order: 3,
  // AI chat components: each row shows the closest one, and there is no switch.
  components: {
    button: { name: "Suggestion", docs: "https://www.ai-elements-vue.com/components/chatbot/suggestion" },
    input: { name: "PromptInput", docs: "https://www.ai-elements-vue.com/components/chatbot/prompt-input" },
    // PromptInput's model picker, a shadcn-vue Select.
    select: { name: "PromptInputSelect", docs: "https://www.ai-elements-vue.com/components/chatbot/prompt-input" },
    // A shadcn-vue Dialog holding a command palette.
    dialog: { name: "ModelSelector", docs: "https://www.ai-elements-vue.com/components/chatbot/model-selector" },
  },
  // The Tailwind entry compiled by @tailwindcss/vite
  cssMatch: ["/src/libs/ai-elements-vue/style.css"],
  // shadcn's `.dark { --* }` tokens and the `dark:` variant
  darkAttrs: { class: "dark" },
};
