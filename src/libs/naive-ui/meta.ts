import type { LibraryMeta } from '../types.ts'

// Styles are injected at runtime by css-render, so there is no CSS file to scope.
export const meta: LibraryMeta = {
  id: 'naive-ui',
  name: 'Naive UI',
  package: 'naive-ui',
  kind: 'styled',
  cssMatch: [],
}
