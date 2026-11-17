import type { LibraryMeta } from "../types.ts";

// Headless components for five frameworks, Vue among them (@hamur/vue), ported from Base UI.
export const meta: LibraryMeta = {
  id: "hamur",
  name: "Hamur",
  docs: "https://hamur.dev/",
  kind: "headless",
  order: 6,
  // Early preview: neither the packages nor the source are public yet, so there's no npm package.
  repository: "productdevbook/hamur",
  cssMatch: [],
  withoutDemos: "not shown: not on npm yet",
};
