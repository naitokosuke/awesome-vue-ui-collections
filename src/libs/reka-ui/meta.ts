import type { LibraryMeta } from '../types.ts'

// Headless: reka-ui ships no CSS. The plain look lives in Demos.vue.
export const meta: LibraryMeta = {
  id: 'reka-ui',
  name: 'Reka UI',
  package: 'reka-ui',
  kind: 'headless',
  cssMatch: [],
  // Demos.vue switches its own neutral tokens on this attribute
  darkAttrs: { 'data-theme': 'dark' },
}
