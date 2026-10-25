import type { LibraryMeta } from "../types.ts";

export const meta: LibraryMeta = {
  id: "primevue",
  name: "PrimeVue",
  package: "primevue",
  kind: "styled",
  order: 13,
  // npm's `repository` points at the private primevue-nextchapter repo.
  repository: "primefaces/primevue",
  cssMatch: [],
  // No license has been obtained, so PrimeVue isn't installed: npm stats only.
  withoutDemos: "not shown: no license",
};
