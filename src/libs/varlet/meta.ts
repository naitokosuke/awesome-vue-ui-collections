import type { LibraryMeta } from '../types.ts'

export const meta: LibraryMeta = {
  id: 'varlet',
  name: 'Varlet',
  package: '@varlet/ui',
  kind: 'styled',
  cssMatch: ['/node_modules/@varlet/ui/'],
  // No darkAttrs: Varlet's dark theme is a set of CSS variables (Themes.dark),
  // applied inline on the cells and the overlay host (see index.ts).
}
