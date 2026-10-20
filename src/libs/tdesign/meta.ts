import type { LibraryMeta } from '../types.ts'

export const meta: LibraryMeta = {
  id: 'tdesign',
  name: 'TDesign',
  package: 'tdesign-vue-next',
  kind: 'styled',
  // The icon package injects its own stylesheet from JS (esm/style/index.css).
  cssMatch: ['/node_modules/tdesign-vue-next/', '/node_modules/tdesign-icons-vue-next/'],
  // dist/tdesign.css switches its tokens on `:root[theme-mode='dark']`
  darkAttrs: { 'theme-mode': 'dark' },
}
