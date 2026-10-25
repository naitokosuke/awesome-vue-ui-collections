import type { LibraryMeta } from "../types.ts";

// Component styles are injected at runtime by css-render, under `n-` prefixed classes. The one
// global rule, the `body` preflight, is imported as a file instead (build/naive-ui-preflight.ts).
export const meta: LibraryMeta = {
  id: "naive-ui",
  name: "Naive UI",
  package: "naive-ui",
  kind: "styled",
  order: 3,
  components: {
    button: { name: "NButton", docs: "https://www.naiveui.com/en-US/os-theme/components/button" },
    input: { name: "NInput", docs: "https://www.naiveui.com/en-US/os-theme/components/input" },
    select: { name: "NSelect", docs: "https://www.naiveui.com/en-US/os-theme/components/select" },
    switch: { name: "NSwitch", docs: "https://www.naiveui.com/en-US/os-theme/components/switch" },
    dialog: { name: "NModal", docs: "https://www.naiveui.com/en-US/os-theme/components/modal" },
  },
  cssMatch: ["virtual:naive-ui-preflight.css"],
};
