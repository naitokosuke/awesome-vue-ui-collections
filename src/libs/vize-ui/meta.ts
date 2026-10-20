import type { LibraryMeta } from '../types.ts'

export const meta: LibraryMeta = {
  id: 'vize-ui',
  name: 'Vize UI',
  package: '@vizejs/ui',
  kind: 'headless',
  cssMatch: ['/node_modules/@vizejs/ui/'],
  // Not a Vize UI attribute: adapter.css keys the presets' light/dark switch off it.
  darkAttrs: { 'data-theme': 'dark' },
}
